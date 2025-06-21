import Logout from "@app/components/logout";
import RewardsCardPreview from "@app/components/rewards-card/rewards-card-preview";
import {
  getUsersRewardsCards,
} from "@app/utils/data-access";
import { getUser } from '@eq-ex/auth';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  ModeToggle
} from "@eq-ex/ui";
import { redirect } from "next/navigation";

export default async function App() {
  const user = await getUser().catch(() => null);

  if (user) {
    const cards = await getUsersRewardsCards(user.id); return (
      <>
        <Logout />


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
                  ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        )}
        {!cards.length && <> no cards found </>}
      </>
    );
  } else {
    redirect("/login");
  }
}
