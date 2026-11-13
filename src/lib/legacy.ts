import { essayUrl, publicEssays } from './essays';

export async function legacyPaths() {
  return (await publicEssays()).flatMap((essay) =>
    essay.data.legacyPaths.map((path) => ({
      params: { legacy: path.slice(1) },
      props: { title: essay.data.title, destination: essayUrl(essay) },
    })),
  );
}
