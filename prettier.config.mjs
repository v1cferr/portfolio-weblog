/**
 * Configuração do Prettier para manter consistência de formatação no projeto
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
  // =================================================
  // CONFIGURAÇÕES BÁSICAS
  // =================================================

  // Define a largura máxima da linha antes de quebrar
  printWidth: 140,

  // Tamanho da indentação (2 espaços é o padrão mais comum em projetos Next.js/React)
  tabWidth: 2,

  // Usar espaços em vez de tabs
  useTabs: false,

  // Adiciona ponto e vírgula no final das declarações
  semi: true,

  // Usa aspas simples ao invés de aspas duplas
  singleQuote: false,

  // Define quando usar aspas em propriedades de objetos
  // "as-needed" = apenas quando necessário
  // "consistent" = mantém consistência se uma prop precisa de aspas
  // "preserve" = mantém como está no código original
  quoteProps: "as-needed",

  // Usa aspas simples em JSX (independente da configuração singleQuote)
  jsxSingleQuote: false,

  // =================================================
  // VÍRGULAS E PONTUAÇÃO
  // =================================================

  // Adiciona vírgula no final quando possível (objetos multi-linha, arrays, etc)
  // "es5" = adiciona onde é válido no ES5 (objetos, arrays, mas não em parâmetros de função)
  // "all" = adiciona em todos os lugares possíveis (incluindo parâmetros de função)
  // "none" = nunca adiciona vírgula no final
  trailingComma: "es5",

  // =================================================
  // ESPAÇAMENTO
  // =================================================

  // Adiciona espaços entre as chaves de objetos
  // { foo: bar } ao invés de {foo: bar}
  bracketSpacing: true,

  // Posição do > em elementos JSX com múltiplas linhas
  // false = coloca o > na próxima linha
  // true = mantém o > no final da última linha
  bracketSameLine: false,

  // =================================================
  // ARROW FUNCTIONS
  // =================================================

  // Define quando usar parênteses em arrow functions com um único parâmetro
  // "always" = sempre usa parênteses: (x) => x
  // "avoid" = evita quando possível: x => x
  arrowParens: "always",

  // =================================================
  // QUEBRA DE LINHA
  // =================================================

  // Tipo de quebra de linha
  // "lf" = Line Feed (\n) - padrão Unix/Linux/Mac
  // "crlf" = Carriage Return + Line Feed (\r\n) - padrão Windows
  // "cr" = Carriage Return (\r) - padrão Mac antigo
  // "auto" = mantém o que já existe no arquivo
  endOfLine: "lf",

  // Adiciona nova linha no final do arquivo
  // Nota: Esta opção é controlada pelo EditorConfig, mas está aqui como referência
  // insertFinalNewline: true,

  // =================================================
  // HTML, CSS E MARKDOWN
  // =================================================

  // Define como o HTML é formatado
  // "css" = respeita a propriedade display do CSS
  // "strict" = todos os elementos são formatados como block ou inline
  // "ignore" = não formata whitespace
  htmlWhitespaceSensitivity: "css",

  // Quebra a linha de prosa do markdown para respeitar printWidth
  // "always" = sempre quebra
  // "never" = nunca quebra
  // "preserve" = mantém como está
  proseWrap: "preserve",

  // =================================================
  // COMENTÁRIOS
  // =================================================

  // Tenta manter a formatação original de comentários
  // Isso evita que o Prettier reformate comentários de uma maneira indesejada
  // (Disponível a partir da versão 3.1.0)
  // experimentalTernaries: false,

  // =================================================
  // PLUGINS E PARSERS CUSTOMIZADOS
  // =================================================

  // Plugins adicionais podem ser adicionados aqui
  plugins: [],

  // =================================================
  // OVERRIDES - CONFIGURAÇÕES ESPECÍFICAS POR TIPO DE ARQUIVO
  // =================================================

  overrides: [
    // Configuração específica para arquivos JSON
    {
      files: ["*.json", ".prettierrc", ".eslintrc"],
      options: {
        tabWidth: 2,
        printWidth: 100,
      },
    },
    // Configuração específica para arquivos YAML
    {
      files: ["*.yml", "*.yaml"],
      options: {
        tabWidth: 2,
      },
    },
    // Configuração específica para arquivos Markdown
    {
      files: ["*.md", "*.mdx"],
      options: {
        proseWrap: "always",
        printWidth: 80,
      },
    },
    // Configuração específica para arquivos de configuração
    {
      files: ["*.config.js", "*.config.mjs", "*.config.ts"],
      options: {
        printWidth: 100,
      },
    },
  ],
};

export default config;
