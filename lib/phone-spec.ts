// Traços visíveis de cada geração de iPhone, deduzidos do nome do produto,
// para a ilustração diferenciar os modelos quando a loja ainda não tem foto.

export type PhoneSpec = {
  /** Módulo de câmeras traseiro. */
  cameras: "triple" | "diagonal" | "vertical" | "single";
  /** Recorte da tela frontal. */
  front: "island" | "notch" | "home";
  /** Plus / Pro Max: desenhado um pouco maior. */
  big: boolean;
};

export function phoneSpec(name: string): PhoneSpec {
  const n = name.toLowerCase();
  const gen = Number(n.match(/iphone\s*(\d+)/)?.[1] ?? 0);
  const pro = /\bpro\b/.test(n);
  const big = /\b(plus|max)\b/.test(n);

  if (/\bse\b/.test(n)) return { cameras: "single", front: "home", big: false };
  if (/\d+e\b/.test(n)) return { cameras: "single", front: "notch", big: false };

  const cameras = pro ? "triple" : gen >= 16 || (gen > 0 && gen <= 12) ? "vertical" : "diagonal";
  // Dynamic Island: todos a partir do 15 e os Pro a partir do 14; X–14 têm notch.
  const front = gen >= 15 || (gen === 14 && pro) || gen === 0 ? "island" : "notch";
  return { cameras, front, big };
}
