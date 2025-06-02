import { redirect } from "next/navigation";
import Logout from "@PNN/components/logout";
import {
  getUser,
  getUsersRewardsCards,
} from "@PNN/utils/data-access/data-acess";
import RewardsCardPreview from "@PNN/components/rewards-card/rewards-card-preview";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@PNN/components/ui/carousel";

export default async function App() {
  const user = await getUser().catch((e) => null);

  if (user) {
    const cards = await getUsersRewardsCards(user.id);

    return (
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
