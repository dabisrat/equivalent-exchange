import RewardsCardPreview from "@app/components/rewards-card/rewards-card-preview";
import { getUsersRewardsCards } from "@app/utils/data-access";
import { getUser } from "@eq-ex/auth";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@eq-ex/ui/components/carousel";
import { redirect } from "next/navigation";

export default async function App() {
  const user = await getUser().catch(() => null);

  if (!user) {
    redirect(`/auth/login`);
  }
  const cards = await getUsersRewardsCards(user.id);

  return (
    <>
      {!!cards.length && (
        <div className="flex justify-center">
          <Carousel className="w-full max-w-xs ">
            <CarouselContent>
              {cards
                .sort((a, b) => a.id.localeCompare(b.id))
                .map((card, index) => (
                  <CarouselItem key={index}>
                    <div className="p-1 cursor-pointer">
                      <RewardsCardPreview key={card.id} card={card} />
                    </div>
                  </CarouselItem>
                ))}{" "}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </div>
      )}
      {!cards.length && <> no cards found </>}
    </>
  );
}
