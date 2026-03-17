import type { Metadata } from 'next'
import { LoginForm } from '@/components/organisms/LoginForm'

export const metadata: Metadata = { title: 'Login' }

export default function LoginPage() {
  return <LoginForm />
}
