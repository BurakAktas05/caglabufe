import {
  AIAssistantContext,
  AIProcessResponse,
  ActionTaken,
} from '../types';
import { contextBuilder } from '../rag/contextBuilder';
import { promptBuilder } from './prompts';
import { toolRegistry } from '../tools';

export class AgentOrchestrator {
  private apiKey: string;
  private model: string = 'gpt-4o-mini';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
  }

  public async process(
    prompt: string,
    context: AIAssistantContext
  ): Promise<AIProcessResponse> {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY ortam değişkeni tanımlı değil.');
    }

    // 1. Build tailored RAG Context (Semantic Vector Search)
    const ragContext = await contextBuilder.buildContext(context, prompt);

    // 2. Build domain-aware System Prompt
    const systemPrompt = promptBuilder.buildSystemPrompt(ragContext);

    // 3. Prepare tools
    const tools = toolRegistry.getOpenAITools();

    // 4. OpenAI Conversation Messages
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ];

    // ReAct Loop: Execute read-only tools on the server (max 2 iterations)
    let maxLoops = 2;
    let actionTaken: ActionTaken | null = null;
    let finalAssistantMessage: string = '';

    while (maxLoops > 0) {
      maxLoops--;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          tools,
          tool_choice: 'auto',
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[OpenAI API Error]', errorText);
        throw new Error(`Yapay zeka servisi hatası: ${response.statusText}`);
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      const message = choice?.message;

      if (!message) {
        break;
      }

      messages.push(message);

      // Check if tool was called
      if (message.tool_calls && message.tool_calls.length > 0) {
        const toolCall = message.tool_calls[0];
        const toolName = toolCall.function.name;
        let args: any = {};
        try {
          args = JSON.parse(toolCall.function.arguments);
        } catch {
          args = {};
        }

        const registeredTool = toolRegistry.get(toolName);

        // If read-only tool (e.g. search_catalog, get_order_summary), execute and continue loop
        if (registeredTool && registeredTool.definition.isReadOnly) {
          const toolResult = await registeredTool.execute(args, {
            context,
            prompt,
          });

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult),
          });

          // Continue loop to let the model generate the final response
          continue;
        }

        // Mutation tool (client will execute):
        actionTaken = {
          tool: toolName,
          arguments: args,
        };

        finalAssistantMessage =
          message.content ||
          `İşlem hazırlandı: ${toolName}`;

        break;
      } else {
        // Direct answer without tool call
        finalAssistantMessage = message.content || 'Komutunuz anlaşıldı.';
        break;
      }
    }

    return {
      assistantMessage: finalAssistantMessage || 'İşleminiz işleme alındı.',
      actionTaken,
    };
  }
}

export const agentOrchestrator = new AgentOrchestrator();
