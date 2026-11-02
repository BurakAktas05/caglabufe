import { AITool, ToolExecutionContext, ToolExecutionResult } from '../types';

export class ToolRegistry {
  private tools: Map<string, AITool> = new Map();

  /**
   * Registers an AI tool (Open/Closed Principle: Extend without modifying existing code).
   */
  public register(tool: AITool): this {
    if (this.tools.has(tool.definition.name)) {
      console.warn(`[ToolRegistry] Overwriting tool: ${tool.definition.name}`);
    }
    this.tools.set(tool.definition.name, tool);
    return this;
  }

  /**
   * Retrieves a registered tool by name.
   */
  public get(name: string): AITool | undefined {
    return this.tools.get(name);
  }

  /**
   * Checks if a tool is registered.
   */
  public has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Returns all registered tools.
   */
  public getAll(): AITool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Converts all registered tools to OpenAI-compatible ChatCompletionTool definitions.
   */
  public getOpenAITools(): Array<{
    type: 'function';
    function: {
      name: string;
      description: string;
      parameters: any;
    };
  }> {
    return this.getAll().map((t) => ({
      type: 'function' as const,
      function: {
        name: t.definition.name,
        description: t.definition.description,
        parameters: t.definition.parameters,
      },
    }));
  }

  /**
   * Executes a tool with the provided arguments and context.
   */
  public async execute(
    name: string,
    args: any,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    const tool = this.get(name);
    if (!tool) {
      return {
        success: false,
        message: `Bilinmeyen araç: ${name}`,
      };
    }

    try {
      return await tool.execute(args, context);
    } catch (error: any) {
      console.error(`[Tool Execution Error] ${name}:`, error);
      return {
        success: false,
        message: `Araç çalıştırılırken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
      };
    }
  }
}

export const toolRegistry = new ToolRegistry();
