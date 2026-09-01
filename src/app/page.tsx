import { BalaansoLanding } from "@/components/BalaansoLanding";

// Landningssidan är en 1:1-port av designfacit (Balaanso Landing.html) och är
// helt statisk — innehållet ÄR prototypens, endast länkarna pekar in i appen.
export const metadata = { title: "Balaanso — Book stays in East Africa" };

export default function HomePage() {
  return <BalaansoLanding />;
}
