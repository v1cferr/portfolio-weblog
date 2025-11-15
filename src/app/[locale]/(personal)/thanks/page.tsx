import Image from "next/image";

// Pagina dedicada para agradecer familia, amigos e colegas que
// contribuiram e contribuem para/com/na minha vida

// Apenas um mock temporário
/**
 *
 */
export default function Thanks() {
  return (
    <div className="container mx-auto p-6 space-y-12">
      {/* Título */}
      <section>
        <h1 className="text-4xl font-bold">Agradecimentos</h1>
        <p className="text-lg">Agradecimentos especiais para quem contribuiu e contribui na minha vida</p>
      </section>

      {/* Família */}
      <section id="family">
        <h2 className="text-2xl font-semibold mb-4">Família</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Mãe */}
          <div className="card shadow-lg p-4 bg-neutral text-neutral-content rounded-lg">
            <Image alt="Mãe" className="rounded-t-lg h-40 w-full object-cover" height={300} src="/images/mother.jpg" width={400} />
            <div className="mt-4">
              <h3 className="text-xl font-bold">Mãe</h3>
              <p>A pessoa mais importante da minha vida</p>
            </div>
          </div>

          {/* Pai */}
          <div className="card shadow-lg p-4 bg-neutral text-neutral-content rounded-lg">
            <Image alt="Pai" className="rounded-t-lg h-40 w-full object-cover" height={300} src="/images/father.jpg" width={400} />
            <div className="mt-4">
              <h3 className="text-xl font-bold">Pai</h3>
              <p>Meu exemplo de vida</p>
            </div>
          </div>

          {/* Irmã */}
          <div className="card shadow-lg p-4 bg-neutral text-neutral-content rounded-lg">
            <Image alt="Irmã" className="rounded-t-lg h-40 w-full object-cover" height={300} src="/images/sister.jpg" width={400} />
            <div className="mt-4">
              <h3 className="text-xl font-bold">Irmã</h3>
              <p>Minha melhor amiga</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
