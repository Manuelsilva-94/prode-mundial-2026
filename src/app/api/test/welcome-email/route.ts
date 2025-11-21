import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/email/email-service'

export async function POST(request: NextRequest) {
  const { email, name } = await request.json()

  const result = await sendWelcomeEmail(email, name)

  return NextResponse.json(result)
}
