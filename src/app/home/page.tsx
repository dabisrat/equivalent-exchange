import RewardsCard from "./rewards-card";

interface User {
  card: { points: number };
}

const Home: React.FC<User> = ({ card }) => {
  // Assuming the user object has a 'points' property
  const points = card?.points || 10;
  return (
    <div>
      <RewardsCard points={points} />
    </div>
  );
};

export default Home;
