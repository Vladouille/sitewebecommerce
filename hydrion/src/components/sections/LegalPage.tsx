import { legal } from '../../content';

export function LegalPage() {
  return (
    <article className="bg-blueprint">
      <div className="container-x max-w-3xl pb-24 pt-32 md:pt-40">
        <p className="label-mono">Mis à jour le {legal.updatedAt}</p>
        <h1 className="mt-4 text-4xl md:text-6xl">Mentions légales</h1>
        <div className="mt-12 space-y-10">
          {legal.sections.map((s) => (
            <section key={s.title} aria-labelledby={slug(s.title)}>
              <h2 id={slug(s.title)} className="text-xl md:text-2xl">
                {s.title}
              </h2>
              {s.body.map((p) => (
                <p key={p} className="mt-3 leading-relaxed text-mist">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}

const slug = (t: string) =>
  t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
