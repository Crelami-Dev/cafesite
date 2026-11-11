import type { Order, OrderStatus } from "@/types";
import OrderCard from "./OrderCard";

interface OrderColumnProps {
  status: OrderStatus;
  title: string;
  empty: string;
  orders: Order[];
  now: number;
  busyId: string;
  errors: Record<string, string>;
  onOpen: (id: string) => void;
  onUpdate: (order: Order, status: OrderStatus, markPaid?: boolean) => void;
}

const accentClass: Record<OrderStatus, string> = {
  waiting: "bg-terracotta-light",
  preparing: "bg-offwhite",
  ready: "bg-offwhite-light",
  completed: "bg-charcoal-muted",
  cancelled: "bg-charcoal-muted",
};

export default function OrderColumn(props: OrderColumnProps): React.JSX.Element {
  return (
    <section className="flex w-full flex-col rounded-xl border border-charcoal-border bg-charcoal-darkest/40">
      <header className="flex items-center gap-2.5 px-4 pt-4 pb-3">
        <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${accentClass[props.status]}`} />
        <h2 className="font-serif text-lg leading-none">{props.title}</h2>
        <span className="ml-auto rounded-full bg-charcoal-light px-2 py-0.5 text-xs text-offwhite-muted">{props.orders.length}</span>
      </header>
      <div className="flex-1 space-y-3 px-3 pb-3">
        {props.orders.length === 0 ? (
          <p className="rounded-xl border border-dashed border-charcoal-border p-4 text-center text-xs leading-5 text-offwhite-darker">{props.empty}</p>
        ) : (
          props.orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              now={props.now}
              busy={props.busyId === order.id}
              error={props.errors[order.id]}
              onOpen={() => props.onOpen(order.id)}
              onUpdate={(status, markPaid) => props.onUpdate(order, status, markPaid)}
            />
          ))
        )}
      </div>
    </section>
  );
}
