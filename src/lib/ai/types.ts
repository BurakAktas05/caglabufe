import { Order, Product, DeliveryZone, DormitoryConfig, SystemSettings, BannedUser } from '@/types';

/**
 * Context provided to the AI assistant for RAG retrieval and tool execution.
 */
export interface AIAssistantContext {
  orders: Order[];
  products: Product[];
  zones: DeliveryZone[];
  dorms: DormitoryConfig[];
  settings: SystemSettings;
  bannedUsers?: BannedUser[];
}

/**
 * OpenAI-compatible Tool Parameter definition (JSON Schema).
 */
export interface AIToolParameterProperty {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  enum?: string[];
  items?: AIToolParameterProperty;
  properties?: Record<string, AIToolParameterProperty>;
  required?: string[];
}

export interface AIToolParametersSchema {
  type: 'object';
  properties: Record<string, AIToolParameterProperty>;
  required?: string[];
}

export interface AIToolDefinition {
  name: string;
  description: string;
  parameters: AIToolParametersSchema;
  /**
   * If true, this tool is executed on the server during the agent ReAct loop
   * (e.g. search_catalog, get_order_summary).
   * If false, this tool is a client-side mutation (e.g. update_order_status).
   */
  isReadOnly?: boolean;
}

export interface ToolExecutionContext {
  context: AIAssistantContext;
  prompt: string;
}

export interface ToolExecutionResult {
  success: boolean;
  message?: string;
  data?: any;
  disambiguation?: DisambiguationData;
}

/**
 * Contract for all AI tools (SOLID: Open/Closed & Single Responsibility).
 */
export interface AITool {
  readonly definition: AIToolDefinition;
  execute(args: any, context: ToolExecutionContext): Promise<ToolExecutionResult> | ToolExecutionResult;
}

/**
 * UI Disambiguation option and payload for resolving ambiguities.
 */
export interface DisambiguationOption {
  id: string;
  name: string;
  subText?: string;
  currentPrice?: number;
  isAvailable?: boolean;
  minOrderAmount?: number;
}

export interface DisambiguationData {
  type: 'product_price' | 'product_stock' | 'dorm_select' | 'amount_select';
  targetId?: string;
  targetName?: string;
  newPrice?: number;
  newDiscountPrice?: number;
  minOrderAmount?: number;
  isAvailable?: boolean;
  options: DisambiguationOption[];
}

export interface ActionTaken {
  tool: string;
  arguments: Record<string, any>;
}

export interface AIProcessResponse {
  assistantMessage: string;
  actionTaken: ActionTaken | null;
  disambiguation?: DisambiguationData;
  error?: string;
}

/**
 * Retrieved product item with scoring and highlights.
 */
export interface ProductMatch {
  product: Product;
  score: number;
  matchedFields: string[];
}
