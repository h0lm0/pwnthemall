import { Challenge } from "@/models/Challenge";
import Head from "next/head";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface CategoryContentProps {
  cat: string;
  challenges: Challenge[];
}

const CategoryContent = ({ cat, challenges }: CategoryContentProps) => {
  return (
    <>
      <Head>
        <title>pwnthemall - {cat}</title>
      </Head>
      <main className="bg-muted flex flex-col items-center justify-start min-h-screen px-6 py-10 text-center">
        <h1 className="text-3xl font-bold mb-6 text-cyan-600 dark:text-cyan-400">
          Category: {cat}
        </h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 w-full max-w-7xl">
          {challenges.map((challenge) => (
            <Card key={challenge.ID} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="text-cyan-700 dark:text-cyan-300">
                  {challenge.Name}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-left space-y-2">
                <p className="text-muted-foreground text-sm">{challenge.Description}</p>
                <p className="text-sm">🎯 Difficulty : {challenge.Difficulty}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </>
  );
};

export default CategoryContent;
