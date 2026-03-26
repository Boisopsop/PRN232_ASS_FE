/**
 * Trang đăng nhập với form RHF + Zod, tài khoản demo và animation.
 */
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2, ShieldCheck, User, Users, Wrench, CalendarCheck2, TriangleAlert, BarChart3 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginApi } from '@/lib/mock/api'
import { getRoleHomePath } from '@/router/getRoleHomePath'
import { useAuthStore } from '@/stores/authStore'

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [shakeKey, setShakeKey] = useState(0)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const loginMutation = useMutation({
    mutationFn: (values: LoginFormValues) => loginApi(values.email, values.password),
    onSuccess: (user) => {
      setFormError(null)
      login(user)
      navigate(getRoleHomePath(user.role), { replace: true })
    },
    onError: (error: unknown) => {
      setShakeKey((prev) => prev + 1)
      setFormError(error instanceof Error ? error.message : 'Đăng nhập thất bại')
    },
  })

  const submitHandler = form.handleSubmit(
    async (values) => {
      setFormError(null)
      await loginMutation.mutateAsync(values)
    },
    () => {
      setShakeKey((prev) => prev + 1)
    },
  )

  const features = useMemo(
    () => [
      { icon: CalendarCheck2, text: 'Đăng ký slot linh hoạt' },
      { icon: TriangleAlert, text: 'Tránh xung đột GVHD' },
      { icon: BarChart3, text: 'Giám sát toàn diện' },
    ],
    [],
  )

  const demoAccounts = useMemo(
    () => [
      {
        roleName: 'Sinh viên',
        email: 'an.sv@uni.edu',
        password: '123456',
        icon: User,
        className: 'border-blue-200 bg-blue-50 text-blue-700',
      },
      {
        roleName: 'GV Review',
        email: 'dung.gvr@uni.edu',
        password: '123456',
        icon: Users,
        className: 'border-green-200 bg-green-50 text-green-700',
      },
      {
        roleName: 'GVHD',
        email: 'lan.gvhd@uni.edu',
        password: '123456',
        icon: Wrench,
        className: 'border-purple-200 bg-purple-50 text-purple-700',
      },
      {
        roleName: 'Moderator',
        email: 'nam.mod@uni.edu',
        password: '123456',
        icon: ShieldCheck,
        className: 'border-orange-200 bg-orange-50 text-orange-700',
      },
    ],
    [],
  )

  const fillAndSubmitDemo = (email: string, password: string) => {
    form.setValue('email', email, { shouldValidate: true, shouldDirty: true })
    form.setValue('password', password, { shouldValidate: true, shouldDirty: true })
    window.setTimeout(() => {
      void submitHandler()
    }, 200)
  }

  return (
    <main className="flex min-h-screen bg-[#F5F7FF]">
      <motion.section
        className="relative hidden w-[45%] overflow-hidden bg-[#0F1B3D] p-10 text-white lg:flex lg:flex-col"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.12 } },
        }}
      >
        <motion.h1
          variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
          className="font-sora text-5xl font-bold"
        >
          CapReview
        </motion.h1>
        <motion.p
          variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
          className="mt-3 max-w-md text-base text-white/80"
        >
          Hệ thống Đăng ký Review Đề tài Tốt nghiệp
        </motion.p>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
          className="relative mt-10 h-56 rounded-2xl border border-white/20 bg-white/5"
        >
          <div className="absolute left-5 top-5 h-16 w-16 rounded-2xl border border-white/30 bg-indigo-500/30" />
          <div className="absolute bottom-8 left-28 h-20 w-20 rounded-full border border-white/30 bg-indigo-400/20" />
          <div className="absolute right-10 top-12 h-24 w-24 rotate-12 rounded-lg border border-white/20 bg-sky-400/20" />
          <div className="absolute bottom-8 right-14 h-12 w-28 rounded-full border border-white/20 bg-violet-400/20" />
        </motion.div>

        <motion.ul className="mt-10 space-y-4">
          {features.map((item) => (
            <motion.li
              key={item.text}
              variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
              className="flex items-center gap-3"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                <item.icon className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium text-white/90">{item.text}</span>
            </motion.li>
          ))}
        </motion.ul>
      </motion.section>

      <section className="flex w-full items-center justify-center p-6 lg:w-[55%]">
        <motion.div
          key={shakeKey}
          initial={{ x: 0 }}
          animate={{ x: [0, -8, 8, -6, 6, 0] }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl"
        >
          <h2 className="font-sora text-3xl font-bold text-slate-900">Đăng nhập</h2>

          <form onSubmit={submitHandler} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@uni.edu"
                {...form.register('email')}
              />
              {form.formState.errors.email ? (
                <p className="text-xs text-[#DC2626]">{form.formState.errors.email.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••"
                  {...form.register('password')}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition-all duration-200 hover:bg-black/5 hover:text-slate-700"
                  aria-label="Hiện/ẩn mật khẩu"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.password ? (
                <p className="text-xs text-[#DC2626]">{form.formState.errors.password.message}</p>
              ) : null}
            </div>

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full rounded-lg bg-[#4F46E5] text-white transition-all duration-200 hover:bg-[#4338CA]"
            >
              {loginMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Đăng nhập
            </Button>

            {formError ? <p className="text-sm text-[#DC2626]">{formError}</p> : null}
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-black/10" />
            <span className="text-xs text-slate-500">hoặc dùng tài khoản demo</span>
            <div className="h-px flex-1 bg-black/10" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {demoAccounts.map((item) => (
              <button
                key={item.email}
                type="button"
                onClick={() => fillAndSubmitDemo(item.email, item.password)}
                className={`rounded-xl border p-3 text-left transition-all duration-200 hover:shadow-sm ${item.className}`}
              >
                <div className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  <span className="text-sm font-semibold">{item.roleName}</span>
                </div>
                <div className="mt-1 truncate text-[11px] opacity-80">{item.email}</div>
              </button>
            ))}
          </div>
        </motion.div>
      </section>
    </main>
  )
}

