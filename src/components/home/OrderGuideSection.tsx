import { Container } from "@/components/ui/Container";
import { OrderGuideInteractive } from "./OrderGuideInteractive";

/**
 * Cara memesan: alur 3 langkah interaktif yang terhubung langsung
 * dengan pratinjau tiket nomor antrean khas CafeSite.
 */
export function OrderGuideSection(): React.JSX.Element {
  return (
    <section
      id="cara-pesan"
      aria-labelledby="order-guide-heading"
      className="home-section bg-charcoal-darkest"
    >
      <Container>
        <OrderGuideInteractive />
      </Container>
    </section>
  );
}
