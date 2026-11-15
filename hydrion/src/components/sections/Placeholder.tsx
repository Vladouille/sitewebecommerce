/**
 * Sections provisoires (phase 1) : servent à tester scroll, ancres, header et dock d'appel.
 * Remplacées par le vrai contenu en phase 2.
 */
const SECTIONS = [
  { id: 'services', title: 'Services' },
  { id: 'tarifs', title: 'Tarifs transparents' },
  { id: 'devis', title: 'Simulateur de devis' },
  { id: 'zone', title: 'Zone d’intervention' },
  { id: 'avis', title: 'Avis clients' },
  { id: 'faq', title: 'Questions fréquentes' },
];

export function Placeholders() {
  return (
    <>
      {SECTIONS.map((s, i) => (
        <section
          key={s.id}
          id={s.id}
          aria-labelledby={`${s.id}-title`}
          className={`border-t border-line ${i % 2 ? 'bg-abyss' : 'bg-blueprint'}`}
        >
          <div className="container-x flex min-h-[70vh] flex-col justify-center py-24">
            <p className="label-mono">0{i + 1} — En construction (phase 2)</p>
            <h2 id={`${s.id}-title`} className="mt-4 text-4xl md:text-6xl">
              {s.title}
            </h2>
          </div>
        </section>
      ))}
    </>
  );
}
