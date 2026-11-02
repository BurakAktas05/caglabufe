import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { guardrails } from '@/lib/ai/agent/guardrails';
import { agentOrchestrator } from '@/lib/ai/agent/orchestrator';

/**
 * Admin AI Assistant API Route (SOLID Controller).
 * Handles authentication, guardrail validation, and delegates to AgentOrchestrator.
 */
export async function POST(req: NextRequest) {
  try {
    // 🛡️ Server-side Admin Authentication Check
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Yetkisiz erişim. Lütfen önce yönetici girişi yapınız.' },
        { status: 401 }
      );
    }

    const { prompt, context } = await req.json();

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json(
        { error: 'Lütfen bir komut veya soru yazın.' },
        { status: 400 }
      );
    }

    // 1. Guardrail Validation (Prompt injection / destructive actions)
    const guardrailCheck = guardrails.validatePrompt(prompt);
    if (!guardrailCheck.isSafe) {
      return NextResponse.json({
        assistantMessage: guardrailCheck.blockReason,
        actionTaken: null,
      });
    }

    // 2. Delegate to AI Agent Orchestrator (RAG + ReAct Tool Calling)
    const result = await agentOrchestrator.process(prompt.trim(), context || {});

    return NextResponse.json({
      assistantMessage: result.assistantMessage,
      actionTaken: result.actionTaken,
    });
  } catch (error: any) {
    console.error('[Admin AI Route Error]', error);
    return NextResponse.json(
      { error: error.message || 'Yapay zeka asistanı çalıştırılırken bir sunucu hatası oluştu.' },
      { status: 500 }
    );
  }
}
