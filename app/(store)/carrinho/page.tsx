import type { Metadata } from "next";
import { CartView } from "@/components/store/cart-view";
import { getSettings } from "@/lib/catalog";

export const metadata: Metadata = { title: "Carrinho", robots: { index: false } };

export default async function CartPage() {
  const s = await getSettings();
  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="text-title mb-8">Seu carrinho</h1>
      <CartView commerce={s.commerce} />
    </div>
  );
}
