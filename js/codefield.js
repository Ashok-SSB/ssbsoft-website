/* ==========================================================
   SSB Soft — code field
   Faint code behind the "Engineering partners" section.
   A soft light follows the pointer and brings it up gently;
   on touch screens the light drifts by itself.
   ========================================================== */
(() => {
  "use strict";

  const section = document.querySelector("#why-us");
  if (!section) return;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* Snippets that quietly tell the SSB story */
  const SNIPPETS = [
    { lang: "ts", code:
`// onboarding: vetted engineers, ready in days
const team = await hire({
  seniority: "senior",
  within: "72h",
  stack: ["react", "node", "java"],
});
team.embed(client.roadmap);` },
    { lang: "java", code:
`@Service
public class Partnership {
  private final Team team = Team.senior();

  public Outcome deliver(Roadmap roadmap) {
    return team.ship(roadmap)
        .withOwnership(Owner.CLIENT)
        .stayFor(Years.of(7));
  }
}` },
    { lang: "sql", code:
`SELECT engineer, tenure_years
FROM   team
WHERE  retention >= 0.98
ORDER  BY knowledge DESC;` },
    { lang: "ts", code:
`export async function launch(idea: Idea) {
  const mvp = await build(idea, { weeks: 3 });
  const signal = await measure(mvp.users);
  return signal.strong ? raise(mvp) : iterate(mvp);
}` },
    { lang: "drl", code:
`rule "Weekend loyalty bonus"
when
  $o : Order( total > 2000, store.region == "UAE" )
then
  $o.applyPoints( 2.0 );
end` },
    { lang: "ts", code:
`// knowledge compounds; nothing resets
assert(retention >= 0.98);
ownership.transfer({ code: true, team: true });` },
    { lang: "java", code:
`public Platform modernize(Legacy app) {
  return Migration.from(app)
      .toCloud(Region.NEAREST)
      .keepRunning(true)   // zero downtime
      .complete();
}` },
    { lang: "sql", code:
`UPDATE clients
SET    stage = 'scale'
WHERE  mvp_shipped = true
  AND  funding_raised > 0;` },
  ];

  /* Tiny highlighter: comments, strings, numbers, keywords, annotations, calls */
  const KEYWORDS = {
    ts: "const|await|async|export|function|return|true|false|new|import|from",
    java: "public|private|final|class|return|new|true|false|void|static",
    sql: "SELECT|FROM|WHERE|ORDER|BY|DESC|UPDATE|SET|AND|true|false",
    drl: "rule|when|then|end",
  };
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const highlight = (code, lang) => {
    const kw = new RegExp(`\\b(${KEYWORDS[lang]})\\b`, "g");
    return code.split("\n").map((line) => {
      const ci = line.indexOf("//");
      const body = ci >= 0 ? line.slice(0, ci) : line;
      const comment = ci >= 0 ? line.slice(ci) : "";
      const html = esc(body)
        .replace(/("[^"]*"|'[^']*')/g, "\u0001s$1\u0002")
        .replace(/(@\w+)/g, "\u0001a$1\u0002")
        .replace(/\b(\d+(?:\.\d+)?h?)\b/g, "\u0001n$1\u0002")
        .replace(kw, "\u0001k$1\u0002")
        .replace(/\b([a-zA-Z_]\w*)(?=\()/g, "\u0001f$1\u0002")
        // resolve markers; ignore matches nested inside strings
        .replace(/\u0001s(.*?)\u0002/g, (_, s) => `<i class="s">${s.replace(/\u0001\w|\u0002/g, "")}</i>`)
        .replace(/\u0001(\w)(.*?)\u0002/g, '<i class="$1">$2</i>');
      return html + (comment ? `<i class="c">${esc(comment)}</i>` : "");
    }).join("\n");
  };

  /* Build the field: columns of snippets, each column drifting at its own pace */
  const field = document.createElement("div");
  field.className = "codefield";
  field.setAttribute("aria-hidden", "true");
  const inner = document.createElement("div");
  inner.className = "codefield__inner";
  const COLS = 4, speeds = [.55, .85, .4, .7];
  const cols = [];
  for (let c = 0; c < COLS; c++) {
    const col = document.createElement("div");
    col.className = "codefield__col";
    // enough snippets to cover the section's height while it drifts
    for (let k = 0; k < 5; k++) {
      const s = SNIPPETS[(c * 3 + k * 2) % SNIPPETS.length];
      const pre = document.createElement("pre");
      pre.innerHTML = highlight(s.code, s.lang);
      col.append(pre);
    }
    inner.append(col);
    cols.push(col);
  }
  field.append(inner);
  section.prepend(field);

  if (reduceMotion) { field.style.setProperty("--r", "0px"); return; }
  // touch screens: a still, soft light; no animation loop to drain the battery
  if (!finePointer) {
    field.style.setProperty("--mx", "72%");
    field.style.setProperty("--my", "30%");
    field.style.setProperty("--r", "240px");
    return;
  }

  /* Light: follows the pointer smoothly; drifts on its own for touch */
  const light = { x: .7, y: .4, r: 0 }, target = { x: .7, y: .4, r: 0 };
  let visible = false, hovering = false, raf = 0, t = 0;

  section.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const r = section.getBoundingClientRect();
    target.x = (e.clientX - r.left) / r.width;
    target.y = (e.clientY - r.top) / r.height;
    hovering = true;
  });
  section.addEventListener("pointerleave", () => { hovering = false; });

  const frame = () => {
    t += .004;
    if (!finePointer || !hovering) {
      // a slow, wandering path when there is no mouse to follow
      target.x = .5 + Math.sin(t * 1.3) * .32;
      target.y = .45 + Math.sin(t * 1.9 + 1) * .25;
    }
    target.r = finePointer ? (hovering ? 260 : 0) : 220;
    light.x += (target.x - light.x) * .09;
    light.y += (target.y - light.y) * .09;
    light.r += (target.r - light.r) * .06;
    field.style.setProperty("--mx", (light.x * 100).toFixed(2) + "%");
    field.style.setProperty("--my", (light.y * 100).toFixed(2) + "%");
    field.style.setProperty("--r", light.r.toFixed(1) + "px");

    // columns drift with the scroll, each at its own speed
    const rect = section.getBoundingClientRect();
    const p = (innerHeight - rect.top) / (innerHeight + rect.height); // 0 → 1 through the section
    cols.forEach((col, i) => { col.style.transform = `translate3d(0, ${(-p * 260 * speeds[i]).toFixed(1)}px, 0)`; });

    raf = visible ? requestAnimationFrame(frame) : 0;
  };

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(frame);
  }).observe(section);
})();
