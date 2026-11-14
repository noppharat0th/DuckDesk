import duckHero from '../../assets/duckdesk-hero.png'
import { SparklesIcon } from '../Icons'

export function WelcomeHero(): React.JSX.Element {
  return (
    <section className="rise relative overflow-hidden rounded-[28px] bg-[#fffdf7] shadow-xs">
      <div className="hero-aurora pointer-events-none absolute inset-0" aria-hidden="true" />
      <div
        className="dot-grid pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-50 [mask-image:linear-gradient(to_left,black,transparent)]"
        aria-hidden="true"
      />

      <div className="relative flex items-center justify-between gap-4 px-6 py-4 sm:px-7 lg:px-8">
        <div className="min-w-0 max-w-[470px]">

          <h1 className="flex flex-col text-[54px] font-extrabold leading-[0.92] tracking-[-0.055em] text-ink">
            Duck<span className="ml-6 text-amber-500">Desk</span>
          </h1>

        </div>

        <div className="relative hidden h-[150px] w-[34%] min-w-[190px] max-w-[270px] shrink-0 md:block">
          <div
            className="absolute inset-x-6 bottom-1 top-5 rounded-[50%] bg-amber-200/45 blur-2xl"
            aria-hidden="true"
          />
          <img
            src={duckHero}
            alt="DuckDesk duck mascot working on a laptop"
            className="relative z-10 size-full object-contain drop-shadow-[0_18px_30px_rgb(120_89_20/0.16)]"
            draggable={false}
          />
          <SparklesIcon
            size={22}
            className="absolute -left-1 top-5 z-20 text-amber-400"
            aria-hidden="true"
          />
          <SparklesIcon
            size={14}
            className="absolute right-3 top-0 z-20 text-amber-300"
            aria-hidden="true"
          />
          <span
            className="absolute bottom-7 left-1 z-20 size-2.5 rounded-full bg-amber-300/80"
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  )
}
