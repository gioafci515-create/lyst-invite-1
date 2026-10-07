/** One stacked section of the single-page experience: a heading plus the feature inside it. */
export default function Panel({ id, step, title, desc, tone = 'paper', wide = false, children }) {
  return (
    <section className={`panel panel--${tone}${wide ? ' panel--wide' : ''}`} id={id} aria-labelledby={`${id}-h`}>
      {title && (
        <div className="panel__head">
          {step && <p className="eyebrow eyebrow--olive">{step}</p>}
          <h2 id={`${id}-h`}>{title}</h2>
          {desc && <p className="panel__desc">{desc}</p>}
        </div>
      )}
      <div className={wide ? 'panel__wide' : 'panel__frame'}>{children}</div>
    </section>
  );
}
