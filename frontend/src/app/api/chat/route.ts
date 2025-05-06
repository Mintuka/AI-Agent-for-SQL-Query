// app/api/chat/route.js
import { getFetchOptions } from '@/app/utils/component-utils';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { question, history } = await request.json();

    if (!question) {
      return NextResponse.json({ error: 'question is required' }, { status: 400 });
    }

    console.log("Received question:", question);
    console.log("Received history:", history);
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/generate`, 
      getFetchOptions('POST', question, '')
    );

    const { text } = response
    return NextResponse.json({ reply: text });

  } catch (error) {
    console.error("Error in chat API route:", error);
    const errorMessage = "An error occurred processing your request.";
    const statusCode = 500;

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}