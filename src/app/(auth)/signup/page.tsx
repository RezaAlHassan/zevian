import type { Metadata } from 'next'
import { RegisterForm } from '@/components/organisms/RegisterForm'

export const metadata: Metadata = { title: 'Sign Up' }

export default function SignupPage() {
    return <RegisterForm />
}
