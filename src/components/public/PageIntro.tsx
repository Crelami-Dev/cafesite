import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import type { PublicIntroProps } from "@/types";
export function PageIntro({
  label,
  title,
  description,
}: PublicIntroProps): React.JSX.Element {
  return (
    <section
      className="hero page-intro"
      data-enter
      aria-labelledby="page-heading"
    >
      <Container>
        <p className="section-label">{label}</p>
        <div className="mt-4 grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <h1 id="page-heading" className="public-h1">
            {title}
          </h1>
          <div>
            <p className="public-lead max-w-md">{description}</p>
            <Button href="/order" className="mt-6 taste-btn-press" data-order-action>
              Pesan sekarang ↗
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
