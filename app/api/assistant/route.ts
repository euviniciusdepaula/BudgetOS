import { NextRequest, NextResponse } from "next/server";
import { AssistantService } from "@/lib/assistant/AssistantService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, monthId } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "A mensagem é obrigatória e deve ser uma string." },
        { status: 400 }
      );
    }

    const reply = await AssistantService.processMessage(message, monthId || null);
    return NextResponse.json(reply);
  } catch (error) {
    console.error("Erro na rota /api/assistant:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Erro interno ao processar a mensagem.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
