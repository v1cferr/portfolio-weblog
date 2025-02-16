import Link from "next/link";
import Image from "next/image";

export default function Goals() {
  return (
    <div className="min-h-screen p-8 space-y-8">
      <h1 className="text-3xl font-bold mb-6">Metas</h1>
      <h2>2025 até 2030</h2>

      <div className="w-full lg:w-1/2">
        <Image
          src="/profissoes-2025-2030.png"
          alt="Metas de 2025 até 2030"
          width={1920}
          height={1080}
          priority={true}
        />
      </div>
      <p>
        Fonte:{" "}
        <Link
          href="https://www.youtube.com/watch?v=d2ZfGqKOyFk"
          className="text-blue-500 hover:underline">
          Relatório revela profissões que estarão em alta no futuro | SBT Brasil
          (11/01/25)
        </Link>
      </p>
    </div>
  );
}
