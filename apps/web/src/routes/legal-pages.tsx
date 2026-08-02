import { Link } from 'react-router-dom'

import { BrandLogo } from '@/components/brand/brand-logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Language } from '@/i18n/dictionaries'
import { useI18n } from '@/i18n/i18n-context'
import { usePageMeta } from '@/lib/use-page-meta'

type LegalSection = {
  title: string
  body: string[]
}

type LegalDocument = {
  title: string
  description: string
  updatedAt: string
  sections: LegalSection[]
}

const privacyDocuments: Record<Language, LegalDocument> = {
  bg: {
    title: 'Политика за поверителност',
    description:
      'Как Левко събира, използва и пази информацията, нужна за управление на лични разходи.',
    updatedAt: 'Последна актуализация: 25 юли 2026 г.',
    sections: [
      {
        title: 'Каква информация събираме',
        body: [
          'Когато създадеш акаунт или влезеш с Google, Левко може да получи имейл адрес, име и профилна снимка от доставчика на идентичност.',
          'Когато използваш приложението, съхраняваме разходите, сумите, датите, плащанията, избраните настройки, език, тема и валута.',
        ],
      },
      {
        title: 'Как използваме информацията',
        body: [
          'Използваме данните, за да показваме dashboard, календар, история на плащанията и настройки на акаунта.',
          'Не продаваме лични данни и не използваме финансовите ти записи за рекламно профилиране.',
        ],
      },
      {
        title: 'Доставчици',
        body: [
          'Левко използва Supabase за authentication и база данни, Google за Google sign-in и cloud инфраструктура за хостинг на приложението.',
          'Тези доставчици обработват данни само доколкото е нужно приложението да работи сигурно и надеждно.',
        ],
      },
      {
        title: 'Контрол върху данните',
        body: [
          'Можеш да редактираш и архивираш разходи от приложението.',
          'За изтриване на акаунт или въпроси относно личните данни се свържи с нас на privacy@levko.bg.',
        ],
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    description:
      'How Levko collects, uses and protects the information needed to manage personal expenses.',
    updatedAt: 'Last updated: July 25, 2026',
    sections: [
      {
        title: 'Information we collect',
        body: [
          'When you create an account or sign in with Google, Levko may receive your email address, name and profile picture from the identity provider.',
          'When you use the app, we store expenses, amounts, dates, payments, selected settings, language, theme and currency.',
        ],
      },
      {
        title: 'How we use information',
        body: [
          'We use the data to show your dashboard, calendar, payment history and account settings.',
          'We do not sell personal data and we do not use your financial records for advertising profiling.',
        ],
      },
      {
        title: 'Service providers',
        body: [
          'Levko uses Supabase for authentication and database storage, Google for Google sign-in and cloud infrastructure to host the application.',
          'These providers process data only as needed to keep the application secure and reliable.',
        ],
      },
      {
        title: 'Control over your data',
        body: [
          'You can edit and archive expenses from the application.',
          'For account deletion or privacy questions, contact us at privacy@levko.bg.',
        ],
      },
    ],
  },
  es: {
    title: 'Política de privacidad',
    description:
      'Cómo Levko recopila, usa y protege la información necesaria para gestionar gastos personales.',
    updatedAt: 'Última actualización: 25 de julio de 2026',
    sections: [
      {
        title: 'Información que recopilamos',
        body: [
          'Cuando creas una cuenta o inicias sesión con Google, Levko puede recibir tu email, nombre y foto de perfil del proveedor de identidad.',
          'Cuando usas la aplicación, guardamos gastos, importes, fechas, pagos, ajustes seleccionados, idioma, tema y moneda.',
        ],
      },
      {
        title: 'Cómo usamos la información',
        body: [
          'Usamos los datos para mostrar tu panel, calendario, historial de pagos y ajustes de cuenta.',
          'No vendemos datos personales ni usamos tus registros financieros para perfiles publicitarios.',
        ],
      },
      {
        title: 'Proveedores',
        body: [
          'Levko usa Supabase para autenticación y base de datos, Google para iniciar sesión con Google e infraestructura cloud para alojar la aplicación.',
          'Estos proveedores procesan datos solo en la medida necesaria para que la aplicación sea segura y fiable.',
        ],
      },
      {
        title: 'Control sobre tus datos',
        body: [
          'Puedes editar y archivar gastos desde la aplicación.',
          'Para eliminar tu cuenta o hacer preguntas de privacidad, contáctanos en privacy@levko.bg.',
        ],
      },
    ],
  },
}

const termsDocuments: Record<Language, LegalDocument> = {
  bg: {
    title: 'Условия за ползване',
    description:
      'Основните правила за използване на Левко като личен инструмент за управление на разходи.',
    updatedAt: 'Последна актуализация: 25 юли 2026 г.',
    sections: [
      {
        title: 'За какво служи Левко',
        body: [
          'Левко е инструмент за лично проследяване на разходи, абонаменти, сметки и еднократни плащания.',
          'Приложението не предоставя финансов, инвестиционен, счетоводен или правен съвет.',
        ],
      },
      {
        title: 'Акаунт',
        body: [
          'Ти отговаряш за достъпа до своя акаунт и за точността на информацията, която въвеждаш.',
          'Не използвай приложението за незаконна дейност или за съхраняване на чувствителни данни, които не са нужни за управление на разходи.',
        ],
      },
      {
        title: 'Наличност и промени',
        body: [
          'Стремим се Левко да бъде достъпен и стабилен, но не гарантираме непрекъсната работа без прекъсвания.',
          'Можем да подобряваме, променяме или премахваме функционалности, когато това е нужно за развитието на продукта.',
        ],
      },
      {
        title: 'Авторски права',
        body: [
          'Левко, включително дизайнът, текстовете, визуалните материали, интерфейсът и оригиналният код, са създадени от Milen Donchev през 2026 година, освен ако изрично не е посочено друго.',
          'Всички права са запазени. Не е разрешено копиране, публикуване, разпространение, модифициране или използване на съдържанието и визуалната идентичност без предварително писмено съгласие.',
        ],
      },
      {
        title: 'Контакт',
        body: [
          'За въпроси относно условията или акаунта можеш да се свържеш с нас на privacy@levko.bg.',
        ],
      },
    ],
  },
  en: {
    title: 'Terms of Service',
    description:
      'The basic rules for using Levko as a personal expense management tool.',
    updatedAt: 'Last updated: July 25, 2026',
    sections: [
      {
        title: 'What Levko is for',
        body: [
          'Levko is a tool for personal tracking of expenses, subscriptions, bills and one-time payments.',
          'The application does not provide financial, investment, accounting or legal advice.',
        ],
      },
      {
        title: 'Account',
        body: [
          'You are responsible for access to your account and for the accuracy of the information you enter.',
          'Do not use the application for illegal activity or to store sensitive data that is not needed for expense management.',
        ],
      },
      {
        title: 'Availability and changes',
        body: [
          'We aim to keep Levko available and stable, but we do not guarantee uninterrupted operation.',
          'We may improve, change or remove features when needed for product development.',
        ],
      },
      {
        title: 'Copyright',
        body: [
          'Levko, including its design, copy, visual materials, interface and original code, was created by Milen Donchev in 2026, unless stated otherwise.',
          'All rights are reserved. You may not copy, publish, distribute, modify or use the content and visual identity without prior written permission.',
        ],
      },
      {
        title: 'Contact',
        body: [
          'For questions about these terms or your account, contact us at privacy@levko.bg.',
        ],
      },
    ],
  },
  es: {
    title: 'Términos de servicio',
    description:
      'Las reglas básicas para usar Levko como herramienta personal de gestión de gastos.',
    updatedAt: 'Última actualización: 25 de julio de 2026',
    sections: [
      {
        title: 'Para qué sirve Levko',
        body: [
          'Levko es una herramienta para seguir gastos personales, suscripciones, facturas y pagos únicos.',
          'La aplicación no ofrece asesoramiento financiero, de inversión, contable ni legal.',
        ],
      },
      {
        title: 'Cuenta',
        body: [
          'Eres responsable del acceso a tu cuenta y de la exactitud de la información que introduces.',
          'No uses la aplicación para actividades ilegales ni para guardar datos sensibles que no sean necesarios para gestionar gastos.',
        ],
      },
      {
        title: 'Disponibilidad y cambios',
        body: [
          'Intentamos mantener Levko disponible y estable, pero no garantizamos funcionamiento ininterrumpido.',
          'Podemos mejorar, cambiar o eliminar funciones cuando sea necesario para el desarrollo del producto.',
        ],
      },
      {
        title: 'Derechos de autor',
        body: [
          'Levko, incluido su diseño, textos, materiales visuales, interfaz y código original, fue creado por Milen Donchev en 2026, salvo que se indique lo contrario.',
          'Todos los derechos están reservados. No se permite copiar, publicar, distribuir, modificar ni usar el contenido y la identidad visual sin permiso previo por escrito.',
        ],
      },
      {
        title: 'Contacto',
        body: [
          'Para preguntas sobre estos términos o tu cuenta, contáctanos en privacy@levko.bg.',
        ],
      },
    ],
  },
}

function LegalLayout({ document }: { document: LegalDocument }) {
  const { t } = useI18n()

  return (
    <main className="min-h-screen bg-gradient-to-br from-cyan-100 via-white to-amber-100 px-6 py-8 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-950">
      <div className="mx-auto grid w-full max-w-4xl gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" aria-label={t('seo.homeTitle')}>
            <BrandLogo
              wordmark={t('common.appName')}
              tagline={t('common.tagline')}
            />
          </Link>
          <Button asChild variant="secondary">
            <Link to="/">{t('legal.backHome')}</Link>
          </Button>
        </header>

        <Card className="border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.9)] shadow-[0_8px_0_rgb(var(--border))] backdrop-blur">
          <CardContent className="grid gap-8 p-5 sm:p-8">
            <section>
              <p className="text-sm font-extrabold text-[#16a063]">
                {document.updatedAt}
              </p>
              <h1 className="mt-3 text-3xl font-extrabold tracking-normal sm:text-4xl">
                {document.title}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[rgb(var(--muted-foreground))] sm:text-base">
                {document.description}
              </p>
            </section>

            <div className="grid gap-6">
              {document.sections.map((section) => (
                <section
                  key={section.title}
                  className="rounded-2xl border-2 border-[rgb(var(--border))] bg-[rgb(var(--surface-subtle))] p-4 shadow-[0_4px_0_rgb(var(--border))]"
                >
                  <h2 className="text-lg font-extrabold">{section.title}</h2>
                  <div className="mt-3 grid gap-3">
                    {section.body.map((paragraph) => (
                      <p
                        key={paragraph}
                        className="text-sm leading-6 text-[rgb(var(--muted-foreground))]"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </CardContent>
        </Card>
        <p className="text-center text-xs font-bold text-[rgb(var(--muted-foreground))]">
          {t('legal.copyright')}
        </p>
      </div>
    </main>
  )
}

export function PrivacyPolicyPage() {
  const { language } = useI18n()
  const document = privacyDocuments[language]
  usePageMeta({
    title: `${document.title} | Levko`,
    description: document.description,
    canonicalUrl: 'https://levko.bg/privacy',
    robots: 'index, follow',
  })

  return <LegalLayout document={document} />
}

export function TermsPage() {
  const { language } = useI18n()
  const document = termsDocuments[language]
  usePageMeta({
    title: `${document.title} | Levko`,
    description: document.description,
    canonicalUrl: 'https://levko.bg/terms',
    robots: 'index, follow',
  })

  return <LegalLayout document={document} />
}
