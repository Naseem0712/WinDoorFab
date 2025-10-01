import { GoogleGenAI, Type } from "@google/genai";
import { DesignConfig, DoorDesign, IronProfile } from '../types';
import { GATE_TYPES, INNER_DESIGNS } from '../constants';

// A cached instance of the AI client.
let ai: GoogleGenAI | null = null;
let isInitialized = false;

/**
 * Checks if the Gemini API is available by looking for the API key.
 * @returns {boolean} True if the API key is present, false otherwise.
 */
export function isAiAvailable(): boolean {
    return !!process.env.API_KEY;
}

/**
 * Lazily initializes and returns the GoogleGenAI client instance.
 * Returns null if the API key is not available.
 */
function getAiInstance(): GoogleGenAI | null {
  if (isInitialized) {
    return ai;
  }
  isInitialized = true; // Mark as initialized even if key is missing

  const API_KEY = process.env.API_KEY;

  if (!API_KEY) {
    console.warn("API_KEY environment variable not set. AI features are disabled.");
    ai = null;
    return null;
  }

  ai = new GoogleGenAI({ apiKey: API_KEY });
  return ai;
}

const doorDesignSchema = {
    type: Type.OBJECT,
    description: "Describes the inner pattern of a single gate door.",
    properties: {
        innerDesign: { 
            type: Type.STRING, 
            enum: INNER_DESIGNS.map(d => d.value),
            description: "The pattern for the inside of the door. Use 'sheet' for privacy."
        },
        innerDesignSequence: {
            type: Type.ARRAY,
            description: "A sequence of bars and gaps for the inner design. Create a short, interesting pattern of 1 to 3 steps that will be repeated.",
            items: {
                type: Type.OBJECT,
                properties: {
                    profileId: { type: Type.STRING, description: "The ID for an inner bar material. Pick a suitable ID from the available profiles (e.g., 'p1' for a 12x12mm pipe)." },
                    gap: { type: Type.NUMBER, description: "The gap in millimeters after this bar. A reasonable value is between 80 and 150." }
                },
                required: ["profileId", "gap"]
            }
        }
    },
    required: ["innerDesign", "innerDesignSequence"]
};


const responseSchema = {
  type: Type.OBJECT,
  properties: {
    gateType: { 
        type: Type.STRING, 
        enum: GATE_TYPES.map(g => g.value),
        description: "The type of gate, like sliding or fixed."
    },
    frameProfileId: { 
        type: Type.STRING,
        description: "The ID for the outer frame material. Pick a suitable ID from the available profiles (e.g., 'p39' for a 40x40mm pipe). Pick a thicker one for 'strong' or 'heavy' prompts."
    },
    leftDoorWidth: {
      type: Type.NUMBER,
      description: "ONLY if gateType is 'sliding-openable', suggest a width for the left door in mm. Otherwise, omit this field."
    },
    leftDoorDesign: doorDesignSchema,
    rightDoorDesign: doorDesignSchema,
  },
  required: ["gateType", "frameProfileId", "leftDoorDesign", "rightDoorDesign"],
};

export async function getDesignSuggestion(prompt: string, currentConfig: Partial<DesignConfig>, gateProfiles: IronProfile[]): Promise<Partial<DesignConfig> | null> {
  const geminiAi = getAiInstance();
  // If AI is not configured, exit early.
  if (!geminiAi) {
      console.error("AI instance is not available. Cannot get suggestions.");
      return null;
  }
  
  const model = "gemini-2.5-flash";

  try {
    const contextPrompt = `
      Current gate specifications:
      - Width: ${currentConfig.width || 'Not set'} ${currentConfig.unit || 'mm'}
      - Height: ${currentConfig.height || 'Not set'} ${currentConfig.unit || 'mm'}
      - Gate Type: ${GATE_TYPES.find(g => g.value === currentConfig.gateType)?.label || 'Not set'}
    `;

    const fullPrompt = `
      Analyze the user's request for an iron gate design and translate it into a structured JSON object based on the provided schema.
      
      ${contextPrompt}

      The user's specific request is: "${prompt}".
      
      Available Profiles for gates: ${gateProfiles.map(p => `${p.id}: ${p.name}`).join(', ')}. The name format is typically 'WIDTHxHEIGHTxWALL_THICKNESS'.
      
      Guidelines:
      1. Use the "Current gate specifications" as context. If the user's request is vague (e.g., "make it look modern"), apply the new design to the existing dimensions and gate type.
      2. If the user's request specifies a different gate type (e.g., "actually, make it a sliding gate"), you can override the current gate type.
      3. For 'strong frame', pick a thicker profile like 'p29' (50x50x2). For 'privacy', use an 'innerDesign' of 'sheet'. For 'simple vertical lines', use 'vertical-bars'.
      4. If the gate type is 'sliding-openable', you can suggest different designs for 'leftDoorDesign' and 'rightDoorDesign' to create an interesting asymmetric look. For example, a smaller openable door could have a 'sheet' design, while the larger sliding door has 'vertical-bars'. If a 'leftDoorWidth' is specified in the context, consider it.
      5. **CRITICAL**: If the 'gateType' is NOT 'sliding-openable' (e.g., 'sliding', 'fixed'), the 'rightDoorDesign' object MUST be an identical copy of the 'leftDoorDesign' object.
      6. The 'gap' value should be in millimeters.
      7. Create an interesting 'innerDesignSequence' with 1 to 3 steps.
    `;
    
    const response = await geminiAi.models.generateContent({
      model: model,
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText);

    const suggestion: Partial<DesignConfig> = {};
    if (GATE_TYPES.some(g => g.value === parsedJson.gateType)) {
      suggestion.gateType = parsedJson.gateType;
    }
    if (gateProfiles.some(p => p.id === parsedJson.frameProfileId)) {
      suggestion.frameProfileId = parsedJson.frameProfileId;
    }
     if (suggestion.gateType === 'sliding-openable' && typeof parsedJson.leftDoorWidth === 'number') {
      suggestion.leftDoorWidth = parsedJson.leftDoorWidth;
    }
    
    const isValidDoorDesign = (design: any): design is DoorDesign => {
      return design &&
             INNER_DESIGNS.some(d => d.value === design.innerDesign) &&
             Array.isArray(design.innerDesignSequence) &&
             design.innerDesignSequence.length > 0 &&
             design.innerDesignSequence.every((step: any) => step.profileId && typeof step.gap === 'number' && gateProfiles.some(p => p.id === step.profileId));
    }

    if (isValidDoorDesign(parsedJson.leftDoorDesign)) {
      suggestion.leftDoorDesign = parsedJson.leftDoorDesign;
    }

    if (isValidDoorDesign(parsedJson.rightDoorDesign)) {
      suggestion.rightDoorDesign = parsedJson.rightDoorDesign;
    }

    // Return suggestion only if it contains at least a valid door design
    return suggestion.leftDoorDesign ? suggestion : null;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return null;
  }
}