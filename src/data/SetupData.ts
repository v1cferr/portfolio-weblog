import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";

interface IPhoto {
  src: string;
  alt: string;
  date: string;
  observation: string;
}

const rawPhotos: Omit<IPhoto, "alt" | "date">[] = [
  {
    src: "/pictures/setup/20250127.jpg",
    observation:
      "Troquei o Mousepad pelo da Alliance Azul bonitão (Redragon) e o gabinete pelo Sharkoon VS9 RGB Branco mesmo.",
  },
  {
    src: "/pictures/setup/20240530.jpg",
    observation:
      "Apenas mostrando o teclado com apoio de pulso e o Wallpaper do álbum 'AM' do Arctic Monkeys. Nenhuma outra peça.",
  },
  {
    src: "/pictures/setup/20231105.png",
    observation:
      "Tirei o gabinete e coloquei os dois monitores na mesa. Deixei o PC em cima de um apoio.",
  },
  {
    src: "/pictures/setup/20230928.jpg",
    observation:
      "Monitor: 'LG UltraGear 27 144Hz 1ms', Teclado: 'Redragon Magic Wand Pro' e Mouse: 'Razer DeathAdder V2'. Todos novos.",
  },
  {
    src: "/pictures/setup/20230417.jpg",
    observation:
      "Já estava com o PC montado graças a ajuda do meu pai <3 (inicio de 2022 até meio de 2023). E Comprei a cadeira 'Mymax MX5'.",
  },
  {
    src: "/pictures/setup/20220308.jpg",
    observation:
      "Apenas a Soundbar 'Redragon Adiemus 6W RMS RGB USB 150Hz/20KHz Botão Touch' em baixo do monitor. O resto é o mesmo.",
  },
  {
    src: "/pictures/setup/20211102.jpg",
    observation:
      "Peguei o Headset 'Redragon Zeus 7.1 H510', Monitor 'AOC 21.5\" 22B1H' e um Mousepad descente: 'Havit HV-MP830'.",
  },
  {
    src: "/pictures/setup/20191209.jpeg",
    observation:
      "Minha irmã jogando wowzinho na época. Mesmo notebook, mesmo teclado, mesmo mouse e mesmo pad.",
  },
  {
    src: "/pictures/setup/20191117.jpeg",
    observation:
      "Eu estudando no notebook 'Acer Aspire 3 (A315-53-32U4)' . Teclado 'Redragon Kumara K552', Mouse 'Redragon Cobra M711' e um pad genérico.",
  },
];

function formatPhotoData(photo: Omit<Photo, "alt" | "date">): Photo {
  const datePattern = /(\d{4})(\d{2})(\d{2})/;
  const match = photo.src.match(datePattern);

  if (!match) {
    const errMsg = `Data não encontrada no nome do arquivo: ${photo.src}`;

    console.error(errMsg);
    return {
      ...photo,
      date: errMsg,
      alt: errMsg,
    };
  }

  const [_, year, month, day] = match;
  const date = parse(`${year}-${month}-${day}`, "yyyy-MM-dd", new Date());
  const formattedDate = format(date, "dd MMM yyyy", { locale: ptBR });
  const formattedAlt = `Setup em ${format(date, "dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  })}`;

  return {
    ...photo,
    date: formattedDate,
    alt: formattedAlt,
  };
}

export const components = [
  {
    category: "Componentes",
    items: [
      {
        name: "Processador (CPU)",
        description:
          "Intel Core i5-11400 11ª Geração, Cache 12MB, 2.6 GHz (4.4GHz Turbo), LGA1200",
      },
      {
        name: "Placa-mãe (MOBO)",
        description: "Asus EX-B560M-V5, Intel B560 LGA 1200, DDR4, ATX",
      },
      {
        name: "Placa de vídeo (GPU)",
        description:
          "Gigabyte NVIDIA GeForce RTX 3050 Gaming OC, LHR, 8GB, GDDR6, DLSS, Ray Tracing",
      },
      {
        name: "Memória (RAM)",
        description:
          "(2x8 GB) TEAM GROUP T-FORCE VULCAN PICHAU, 8GB (1X8), DDR4, 3200MHZ, C16, VERMELHA",
      },
      {
        name: "Armazenamento (M2 Gen 4)",
        description:
          "SSD 1TB Kingston KC3000, M.2 2280 PCIe, NVMe, Leitura: 7000MB/s e Gravação: 6000MB/s",
      },
      {
        name: "Armazenamento (M2 Gen 3)",
        description:
          "KingSpec 1TB M.2 NMVe 2280 PCIe 3x4 Leitura: 2400Mbps, Escrita: 1800Mbps",
        url: "https://pt.aliexpress.com/item/32847169083.html",
      },
      {
        name: "Fonte de alimentação (PSU)",
        description: "Sharkoon WPM Gold Zero, 550W, 80 Plus Gold, Semi-Modular",
      },
      {
        name: "Gabinete (CASE)",
        description:
          "Gabinete Gamer Sharkoon VS9 RGB, Mid Tower, ATX, Lateral em Vidro Temperado, 3x Cooler Fan, Branco - VS9 RGB",
        url: "https://www.kabum.com.br/produto/508876/gabinete-gamer-sharkoon-vs9-rgb-mid-tower-atx-lateral-em-vidro-temperado-3x-cooler-fan-branco-vs9-rgb",
      },
    ],
  },
  {
    category: "Periféricos",
    items: [
      {
        name: "Water Cooler",
        description: "Pichau Gaming Aqua X100 RTB RGB, PG-AQX100-RTB",
      },
      {
        name: "Adaptador de Rede",
        description:
          "Adaptador WiFi D-Link, AC1200, Dual-Band, 5GHz 802.11ac, USB 3.0 - DWA-182",
      },
      {
        name: "Caixa de Som",
        description:
          "Soundbar Gamer Redragon Adiemus, 6W RMS, RGB, USB, 150Hz/20KHz, Botão Touch, Preto - GS560",
      },
      {
        name: "Cadeira",
        description: "Cadeira Gamer Mymax MX5, Giratória, Preto/Vermelho",
      },
      {
        name: "Mouse",
        description:
          "Razer DeathAdder V2 Gaming Mouse 20000 DPI Sensor óptico-Iluminação Chroma RGB-8 botões programáveis",
      },
      {
        name: "Mousepad",
        description: "Redragon World of Warcraft Aliança 300x800x3mm Azul",
        // url: "https://www.redragon.store/mousepad-redragon-world-of-warcraft-alianca-300x800x3mm-azul",
      },
      {
        name: "Controle Joystick",
        description:
          "Gamepad Machenike G5 Pro Elite Hall Gatilho Joystick Botões Mecha-Táteis Para Switch PC Android IOS",
      },
      {
        name: "Teclado Mecânico",
        description:
          "Redragon TECLADO OPTICO GAMER MAGIC-WAND PRO RGB BRANCO SWITCH VERMELHO ABNT2",
        url: "https://www.redragon.com.br/magicwandpro-lunarwhite",
      },
      {
        name: "Webcam",
        description: "Webcam Redragon Streaming Fobos, 720p | KaBuM!",
      },
      {
        name: "Headset over-ear",
        description:
          "Baseus GH02 Gaming Wireless Headphone com microfone Over-Ear Fones de ouvido Bluetooth 5.3 40mm Driver 2.4G/Wireless/Cable RGB",
        url: "https://pt.aliexpress.com/item/1005005875379717.html",
      },
      {
        name: "Fone in-ear",
        description: "Baseus Bowie MA10 Pro ANC Earphones",
        url: "https://pt.aliexpress.com/item/1005006079931969.html",
      },
      {
        name: "Monitor principal",
        description:
          "Monitor Gamer LG UltraGear 27 Full HD, 144Hz, 1ms, IPS, HDMI e DisplayPort, HDR 10, 99% sRGB, FreeSync Premium, VESA - 27GN65R",
        url: "https://www.lg.com/br/monitores/monitores-ultragear/27gn65r-b/",
      },
      {
        name: "Monitor secundário",
        description: 'Monitor AOC 21.5" 22B1H Led Full HD',
      },
    ],
  },
  {
    category: "Possíveis Upgrades",
    items: [
      {
        name: "Nobreak Senoidal",
        description: "ATTIV SENO 700 VA BI",
        url: "https://www.intelbras.com/pt-br/energia/nobreaks/senoidal",
      },
      {
        name: "Soundbar com Subwoofer",
        description:
          "Caixa de som com Subwoofer 30W RMS EDIFIER G1500 MAX - Preto",
        url: "https://edifier.com.br/caixa-de-som-gamer-bluetooth-edifier-g1500-max-hecate-preto.html",
      },
    ],
  },
  {
    // TODO: Completar a seção de ex-peças (e.g.: Redragon Kumara, Razer Hammerhead, Sharkoon VG6, etc.)
    // TODO: Posteriormente adicionar um review para cada ex-peça
    category: "Ex-Peças",
    items: [
      {
        name: "Teclado Mecânico",
        description: "Redragon Kumara Switch Blue ABNT2 K552",
        url: "https://www.redragon.com.br/kumarargbabnt2blue",
      },
      {
        name: "Fone de Ouvido",
        description: "Razer Hammerhead",
        url: "https://www.razer.com/br-pt/mobile-earphones/razer-hammerhead-true-wireless-x",
      },
      {
        name: "Gabinete",
        description: "Sharkoon VG6",
        url: "https://pt.sharkoon.com/product/VG6W",
      },
      {
        name: "Mouse",
        description: "Redragon Cobra M711",
        url: "https://www.redragon.com.br/cobra",
        // date: "2021-06-01",
        // time: "3 meses", (TODO: Fazer uma lógica para calcular o tempo)
      },
      {
        name: "Mousepad",
        description: "Havit HV-MP830",
        url: "https://havitoficial.mercadoshops.com.br/mouse-pad-gamer-havit-gamer-hv-mp830-de-borracha-magic-eagle-30cm-x-90cm-x-3mm-preto/p/MLB15457261",
        // date: "2021-06-01",
        // time: "3 meses", (TODO: Fazer uma lógica para calcular o tempo)
      },
      {
        name: "Headset over-ear",
        description: "Redragon Zeus 7.1 H510",
        url: "https://www.redragon.com.br/zeus",
      },
    ],
  },
];

export const stores = [
  {
    name: "Kabum",
    url: "https://www.kabum.com.br",
  },
  {
    name: "AliExpress",
    url: "https://pt.aliexpress.com",
  },
  {
    name: "Redragon",
    url: "https://www.redragon.com.br",
  },
  {
    name: "TerabyteShop",
    url: "https://www.terabyteshop.com.br",
  },
  {
    name: "Pichau",
    url: "https://www.pichau.com.br",
  },
];

export const photos: Photo[] = rawPhotos.map(formatPhotoData);
