// src/app/doctrine/page.tsx

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`ura-card p-6 md:p-7 ${className}`}>
      {children}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="ura-panel px-5 py-4">
      <div className="ura-section-label">{title}</div>
      <div className="mt-2 text-sm ura-text-secondary">{children}</div>
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <div className="ura-section-label">{children}</div>;
}

function P({ children }: { children: React.ReactNode }) {
  return <div className="text-sm leading-relaxed ura-text-secondary">{children}</div>;
}

function Bullet({ children }: { children: React.ReactNode }) {
  return <li className="text-sm leading-relaxed ura-text-secondary">{children}</li>;
}

type Phase = {
  id: number;
  name: string;
  range: string;
  orisha: string;
  gist: string;
  functionLine: string;
  ecology: string;
  psyche: string;
  distortion: string;
  participation: string;
};

const PHASES: Phase[] = [
  {
    id: 1,
    name: "Emergence",
    range: "0°–45°",
    orisha: "Eshu",
    gist: "Energy rises from dormancy. Direction returns before clarity. Movement precedes certainty.",
    functionLine: "Function: Initiation",
    ecology: "Ecological Role: Threshold crossing, first motion",
    psyche: "Psychological Orientation: Curiosity, responsiveness",
    distortion: "Distortion if suppressed: Stagnation, anxiety",
    participation: "Right participation: Begin lightly; let clarity follow action",
  },
  {
    id: 2,
    name: "Establishment",
    range: "45°–90°",
    orisha: "Obatala",
    gist: "Structure forms. Boundaries are set. Ethics emerge. This phase determines whether the cycle can endure.",
    functionLine: "Function: Stabilization",
    ecology: "Ecological Role: Grounding, skeletal order, soil formation",
    psyche: "Psychological Orientation: Regulation, restraint",
    distortion: "Distortion if suppressed: Fragility, future collapse",
    participation: "Right participation: Build simple, sustainable structure",
  },
  {
    id: 3,
    name: "Differentiation",
    range: "90°–135°",
    orisha: "Oshun",
    gist: "Life is refined through subtle care. Attention matters. This phase sustains systems through invisible labor.",
    functionLine: "Function: Tending",
    ecology: "Ecological Role: Micro-life, medicinal systems",
    psyche: "Psychological Orientation: Discernment, maintenance",
    distortion: "Distortion if suppressed: Burnout, neglect",
    participation: "Right participation: Improve quality, not scale",
  },
  {
    id: 4,
    name: "Bonding",
    range: "135°–180°",
    orisha: "Yemọja",
    gist: "Containment precedes independence. Safety enables growth.",
    functionLine: "Function: Belonging",
    ecology: "Ecological Role: Nurseries, water systems",
    psyche: "Psychological Orientation: Attachment, co-regulation",
    distortion: "Distortion if suppressed: Isolation, insecurity",
    participation: "Right participation: Strengthen support systems",
  },
  {
    id: 5,
    name: "Assertion",
    range: "180°–225°",
    orisha: "Ṣàngó",
    gist: "Presence becomes visible. Authority carries consequence.",
    functionLine: "Function: Execution",
    ecology: "Ecological Role: Apex regulation",
    psyche: "Psychological Orientation: Responsibility, leadership",
    distortion: "Distortion if suppressed: Collapse, indecision",
    participation: "Right participation: Act decisively and accountably",
  },
  {
    id: 6,
    name: "Transformation",
    range: "225°–270°",
    orisha: "Oya — Ogun",
    gist: "Decay renews systems. Endings are necessary.",
    functionLine: "Function: Release",
    ecology: "Ecological Role: Compost, storms, scavenging",
    psyche: "Psychological Orientation: Grief, surrender",
    distortion: "Distortion if suppressed: Stagnation, decay without renewal",
    participation: "Right participation: Let go cleanly",
  },
  {
    id: 7,
    name: "Dissolution",
    range: "270°–315°",
    orisha: "Olokun",
    gist: "Individual edges soften. Context expands.",
    functionLine: "Function: Return to scale",
    ecology: "Ecological Role: Deep ocean cycles",
    psyche: "Psychological Orientation: Ego softening",
    distortion: "Distortion if suppressed: Nihilism, escapism",
    participation: "Right participation: Widen the frame",
  },
  {
    id: 8,
    name: "Witnessing",
    range: "315°–360°",
    orisha: "Ọ̀rúnmìlà",
    gist: "Experience converts into guidance. Wisdom emerges.",
    functionLine: "Function: Integration",
    ecology: "Ecological Role: Migration, pattern recognition",
    psyche: "Psychological Orientation: Reflection",
    distortion: "Distortion if suppressed: Repetition without learning",
    participation: "Right participation: Extract meaning",
  },
];

export default function DoctrinePage() {
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto w-full max-w-5xl">
        {/* Header */}
        <div className="mb-5">
          <div className="ura-section-label">URA</div>
          <div className="ura-page-title mt-1">Doctrine</div>
        </div>

        {/* Title */}
        <Card>
          <div className="text-center">
            <div className="ura-section-label">URA</div>

            <div className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight ura-text-primary">
              A Temporal–Ecological System for Human Orientation
            </div>

            <div className="mt-3 text-sm md:text-base ura-text-secondary">
              URA is a timing system. It restores coherence between effort, season, and meaning.
            </div>
          </div>
        </Card>

        <div className="mt-4">
          <Card>
            <H2>I. What URA Is</H2>
            <div className="mt-3 space-y-3">
              <P>URA is a temporal orientation system.</P>

              <ul className="mt-2 list-disc pl-5 space-y-2">
                <Bullet>It does not predict events.</Bullet>
                <Bullet>It does not classify personality.</Bullet>
                <Bullet>It does not prescribe identity or belief.</Bullet>
              </ul>

              <P>
                URA orients the human nervous system in time. It restores the capacity to recognize what
                kind of time one is in, and therefore what mode of engagement is appropriate. Its
                function is not control, but coherence.
              </P>

              <P>
                URA treats time not as an abstract measurement, but as a living process—one that moves
                cyclically through phases of emergence, stabilization, assertion, integration,
                dissolution, and renewal.
              </P>

              <P>
                Where modern systems emphasize constant output, URA restores temporal literacy: the
                ability to perceive rhythm, seasonality, and phase-dependent behavior.
              </P>
            </div>
          </Card>
        </div>

        <div className="mt-4">
          <Card>
            <H2>II. Foundational Assumptions</H2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <Panel title="1. Time is cyclical, not linear">
                Human experience unfolds in recurring arcs, not straight lines. Growth, decay, rest, and
                renewal are structural necessities, not failures of discipline.
              </Panel>
              <Panel title="2. Consciousness is ecological">
                Human psychology evolved in continuous relationship with non-human systems. Mental health
                depends on participation in rhythms larger than the individual.
              </Panel>
              <Panel title="3. Symbols arise from embodiment">
                Meaning does not originate in abstraction. It emerges from lived interaction between
                body, environment, and time.
              </Panel>
              <Panel title="4. Animals are participants, not metaphors">
                Animals function simultaneously as ecological agents and symbolic interfaces. Their
                presence reflects system health; their disappearance signals ecological and perceptual
                collapse.
              </Panel>
              <Panel title="5. Wisdom emerges through pattern recognition">
                Meaning is not immediate. It is generated retrospectively, through witnessing cycles
                across time.
              </Panel>
            </div>
          </Card>
        </div>

        <div className="mt-4">
          <Card>
            <H2>III. Core Ontological Layers</H2>
            <div className="mt-3">
              <P>URA operates through five interlocking layers, each incomplete without the others.</P>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <Panel title="Layer 1 — Time">
                Time is expressed as an 8-phase recurring cycle. Each phase is a qualitative state of
                motion, not a duration.
              </Panel>
              <Panel title="Layer 2 — Ecology">
                Each phase corresponds to an ecological function necessary for system stability. No
                phase is optional. Suppression produces distortion.
              </Panel>
              <Panel title="Layer 3 — Psyche">
                Human psychological states mirror ecological functions. Mental coherence depends on
                phase-appropriate behavior.
              </Panel>
              <Panel title="Layer 4 — Symbolic Interface">
                Animals and natural processes serve as perceptual anchors. Symbols are tools for
                recognition, not objects of belief.
              </Panel>
              <Panel title="Layer 5 — Modality (Orisha)">
                Orisha represent modes of life intelligence. They describe how energy moves, not who a
                person is.
              </Panel>
            </div>
          </Card>
        </div>

        <div className="mt-4">
          <Card>
            <H2>IV. The Ascendant Year</H2>
            <div className="mt-3 space-y-3">
              <P>At the center of the URA system is the Ascendant Year.</P>
              <P>
                The Ascendant is not symbolic. It is a precise astronomical degree—the point where the
                ecliptic intersects the eastern horizon at birth. In URA, this degree functions as the
                zero-point of the personal year.
              </P>
              <P>
                Each year, when the transiting Sun returns to this degree, a new internal year begins.
                This is not calendar-based. It is geometric.
              </P>
              <P>
                From that moment forward, the angular distance between the Sun and the natal Ascendant
                defines where the individual is within their personal seasonal cycle. The Ascendant Year
                is therefore measured by angular separation (0°–360°), not dates.
              </P>
              <div className="mt-4 ura-panel px-5 py-4">
                <div className="text-sm ura-text-primary">
                  The chart is a clock, not a label.
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-4">
          <Card>
            <H2>V. The Eight Phases of the Ascendant Year</H2>
            <div className="mt-3 space-y-3">
              <P>
                The Ascendant Year is divided into eight equal phases of 45°. These phases are modes of
                engagement, not personality traits or emotional states.
              </P>

              <div className="mt-4 grid grid-cols-1 gap-3">
                {PHASES.map((p) => (
                  <details key={p.id} className="ura-panel px-5 py-4">
                    <summary className="cursor-pointer select-none list-none" style={{ outline: "none" }}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold ura-text-primary">
                            Phase {p.id} — {p.name}{" "}
                            <span className="ura-text-muted">({p.range})</span>
                          </div>
                          <div className="mt-1 text-xs ura-text-muted">
                            Modal Intelligence:{" "}
                            <span className="font-semibold ura-text-accent">{p.orisha}</span>
                          </div>
                        </div>

                        <div className="ura-btn-secondary text-xs px-3 py-1">
                          Open
                        </div>
                      </div>
                    </summary>

                    <div className="mt-3 space-y-2">
                      <P>{p.gist}</P>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <Panel title="Function">{p.functionLine.replace("Function: ", "")}</Panel>
                        <Panel title="Ecology">{p.ecology.replace("Ecological Role: ", "")}</Panel>
                        <Panel title="Psyche">{p.psyche.replace("Psychological Orientation: ", "")}</Panel>
                        <Panel title="Distortion">{p.distortion.replace("Distortion if suppressed: ", "")}</Panel>
                      </div>
                      <div className="mt-3 ura-panel px-5 py-4" style={{ background: "var(--ura-bg-secondary)" }}>
                        <div className="ura-section-label">Right participation</div>
                        <div className="mt-2 text-sm ura-text-primary">
                          {p.participation.replace("Right participation: ", "")}
                        </div>
                      </div>
                    </div>
                  </details>
                ))}
              </div>

              <div className="mt-4 text-sm ura-text-secondary">
                At 360°, the Sun returns to the Ascendant degree, and a new cycle begins.
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-4">
          <Card>
            <H2>VI. Relationship to Astrology</H2>
            <div className="mt-3 space-y-3">
              <P>URA treats astrology as a time-mapping system, not a belief framework.</P>
              <ul className="list-disc pl-5 space-y-2">
                <Bullet>
                  <span className="font-semibold ura-text-primary">Planets</span>{" "}
                  describe forces
                </Bullet>
                <Bullet>
                  <span className="font-semibold ura-text-primary">Signs</span>{" "}
                  describe instinctual zones
                </Bullet>
                <Bullet>
                  <span className="font-semibold ura-text-primary">The URA cycle</span>{" "}
                  describes when and how forces are metabolized
                </Bullet>
              </ul>
              <P>URA absorbs astrological data without becoming deterministic.</P>
            </div>
          </Card>
        </div>

        <div className="mt-4">
          <Card>
            <H2>VII. Planetary Overlay</H2>
            <div className="mt-3 space-y-3">
              <P>Planets describe pressure, not destiny.</P>
              <P>
                Each planet expresses differently depending on phase context. Misalignment occurs when
                force is expressed out of phase.
              </P>

              <div className="ura-panel px-5 py-4">
                <div className="ura-section-label">Operative sequence</div>
                <div className="mt-2 text-sm ura-text-primary">
                  Planet (force) → Orisha (motion) → Phase (timing)
                </div>
              </div>

              <P>
                Remove any layer and the system collapses into fate (planet-only), myth (symbol-only),
                or productivity cycles (phase-only).
              </P>
            </div>
          </Card>
        </div>

        <div className="mt-4">
          <Card>
            <H2>VIII. The Progressed Lunation System</H2>
            <div className="mt-3 space-y-3">
              <P>The Progressed Lunation System tracks inner developmental seasons across life.</P>
              <P>
                Using secondary progressions, the angular relationship between the progressed Sun and
                Moon forms a 29–30 year cycle, divided into eight phases.
              </P>
              <P>
                URA uses this system to orient emotional readiness, identity development, and timing of
                internal change. It does not predict outcomes. It restores coherence between effort and
                season.
              </P>
            </div>
          </Card>
        </div>

        <div className="mt-4">
          <Card>
            <H2>IX. Distortion Model</H2>
            <div className="mt-3 space-y-2">
              <P>Suffering arises when phases are resisted or inverted:</P>
              <ul className="list-disc pl-5 space-y-2">
                <Bullet>Emergence without structure → anxiety</Bullet>
                <Bullet>Structure without care → rigidity</Bullet>
                <Bullet>Authority without release → tyranny</Bullet>
                <Bullet>Dissolution without witnessing → nihilism</Bullet>
              </ul>
              <P>URA is therefore diagnostic as well as orientational.</P>
            </div>
          </Card>
        </div>

        <div className="mt-4">
          <Card>
            <H2>X. Ethical Position</H2>
            <div className="mt-3 space-y-3">
              <P>URA does not prescribe morality.</P>
              <P>
                It asserts: misalignment produces suffering, participation produces meaning, and
                listening precedes control.
              </P>
              <P>
                URA rejects domination models, abstraction without embodiment, and symbolism without
                responsibility.
              </P>
            </div>
          </Card>
        </div>

        <div className="mt-4">
          <Card>
            <H2>XI. Intended Use</H2>
            <div className="mt-3">
              <P>URA is designed to function as:</P>
              <ul className="mt-3 list-disc pl-5 space-y-2">
                <Bullet>a daily orientation tool</Bullet>
                <Bullet>a reflective system</Bullet>
                <Bullet>a research lens</Bullet>
                <Bullet>a UI logic for temporal design</Bullet>
                <Bullet>a bridge between science, culture, and spirituality</Bullet>
              </ul>
            </div>
          </Card>
        </div>

        <div className="mt-4">
          <Card>
            <div className="text-center">
              <div className="text-sm font-semibold ura-text-accent">
                Truth is knowing what time it is.
              </div>
              <div className="mt-2 text-sm ura-text-secondary">
                URA exists to restore that knowledge.
              </div>
              <div className="mt-4 text-sm ura-text-secondary">
                When timing is respected: effort decreases, clarity increases, meaning returns.
              </div>
              <div className="mt-1 text-sm ura-text-secondary">
                Human beings are seasonal organisms. Life becomes coherent when we stop arguing with our own timing.
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-6 text-center text-xs ura-text-muted">
          URA • A Temporal–Ecological System for Human Orientation
        </div>
      </div>
    </div>
  );
}
