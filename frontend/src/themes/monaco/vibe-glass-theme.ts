import { editor } from 'monaco-editor'; // Importar tipo IStandaloneThemeData

// Define o tipo para clareza
type ThemeMode = 'light' | 'dark';

/**
 * Define o tema customizado 'vibe-glass-theme' para o Monaco Editor.
 * Suporta modos claro (light) e escuro (dark).
 * 
 * @param themeMode O modo de tema atual ('light' ou 'dark').
 * @returns A definição do tema para monaco.editor.defineTheme.
 */
export const getVibeGlassTheme = (themeMode: ThemeMode): editor.IStandaloneThemeData => {
  const isDark = themeMode === 'dark';

  // Paleta de Cores Base (Glassmorphism inspirado)
  const colors = {
    // Tons base (ajustar opacidade/cores conforme necessário)
    bgTransparent: '#ffffff08', // Fundo sutilmente branco/transparente (dark)
    bgTransparentLight: '#00000005', // Fundo sutilmente preto/transparente (light)
    fgPrimaryDark: '#d4d4d4',   // Foreground principal (dark)
    fgPrimaryLight: '#3b3b3b',  // Foreground principal (light)
    fgSecondaryDark: '#8a939e',  // Cinza suave para comentários/números linha (dark)
    fgSecondaryLight: '#858585', // Cinza suave (light)

    // Acentos (Azul/Roxo/Verde suave)
    accentBlueDark: '#80bfff',   // Azul claro
    accentBlueLight: '#007acc',  // Azul mais forte
    accentPurpleDark: '#d0aeff', // Roxo claro
    accentPurpleLight: '#a37acc',// Roxo médio
    accentPinkDark: '#f975d5', // Rosa/Magenta
    accentPinkLight: '#c5158a', // Rosa/Magenta escuro
    accentGreenDark: '#80ffea',  // Verde/Ciano claro
    accentGreenLight: '#108a6e', // Verde escuro
    accentOrangeDark: '#ffd08a', // Laranja claro
    accentOrangeLight: '#ca7c1a',// Laranja/Marrom
    accentRedDark: '#ff808a',    // Vermelho claro (erros)
    accentRedLight: '#d73a49',   // Vermelho escuro (erros)
    
    // UI Elements
    selectionBgDark: '#3d5a7899', // Azul seleção transparente
    selectionBgLight: '#add6ff99',// Azul seleção transparente
    gutterBg: '#ffffff00',       // Gutter transparente
    lineNumberFgDark: '#6e7681a0', // Números linha mais transparentes
    lineNumberFgLight: '#aaaaaaa0',
    lineNumberActiveFgDark: '#bbbbbb',
    lineNumberActiveFgLight: '#666666',
    cursorColor: isDark ? '#cccccc' : '#333333',
    widgetBgDark: '#1e1e1ec0', // Widgets com fundo semi-transparente
    widgetBgLight: '#f3f3f3e0',
    widgetBorderDark: '#45454580',
    widgetBorderLight: '#c8c8c8a0',
    scrollbarBgDark: '#4e4e4e30', // Scrollbars mais sutis
    scrollbarBgLight: '#aaaaaa30',
    scrollbarHoverDark: '#68686860',
    scrollbarHoverLight: '#99999960',
    scrollbarActiveDark: '#83838390',
    scrollbarActiveLight: '#77777790',
    diffInsertedBgDark: '#2ea0431a',
    diffInsertedBgLight: '#abf2bc33',
    diffRemovedBgDark: '#f851491a',
    diffRemovedBgLight: '#ffcec633',
  };

  return {
    base: isDark ? 'vs-dark' : 'vs',
    inherit: true,
    rules: [
      // --- Geral ---
      { token: '', foreground: isDark ? colors.fgPrimaryDark : colors.fgPrimaryLight }, // Default
      { token: 'comment', foreground: isDark ? colors.fgSecondaryDark : colors.fgSecondaryLight, fontStyle: 'italic' },
      { token: 'string', foreground: isDark ? colors.accentOrangeDark : colors.accentOrangeLight },
      { token: 'string.escape', foreground: isDark ? colors.accentPinkDark : colors.accentPinkLight },
      { token: 'number', foreground: isDark ? colors.accentGreenDark : colors.accentGreenLight },
      { token: 'regexp', foreground: isDark ? colors.accentPinkDark : colors.accentPinkLight },
      
      // --- Keywords & Controle ---
      { token: 'keyword', foreground: isDark ? colors.accentPurpleDark : colors.accentPurpleLight, fontStyle: 'bold' },
      { token: 'keyword.control', foreground: isDark ? colors.accentPurpleDark : colors.accentPurpleLight, fontStyle: 'bold' },
      { token: 'keyword.operator', foreground: isDark ? colors.fgSecondaryDark : colors.fgSecondaryLight },
      { token: 'keyword.operator.new', fontStyle: 'bold' },
      { token: 'keyword.operator.expression', fontStyle: 'bold' },
      { token: 'keyword.operator.logical', fontStyle: 'bold' }, // Ex: &&, ||
      { token: 'storage', foreground: isDark ? colors.accentPurpleDark : colors.accentPurpleLight }, // Ex: const, let, var, static
      { token: 'storage.type', foreground: isDark ? colors.accentPurpleDark : colors.accentPurpleLight },
      { token: 'storage.modifier', foreground: isDark ? colors.accentPurpleDark : colors.accentPurpleLight }, // Ex: public, private

      // --- Identificadores & Variáveis ---
      { token: 'identifier', foreground: isDark ? colors.accentBlueDark : colors.accentBlueLight },
      { token: 'variable', foreground: isDark ? colors.accentBlueDark : colors.accentBlueLight },
      { token: 'variable.parameter', foreground: isDark ? colors.accentOrangeDark : colors.accentOrangeLight }, // Parâmetros de função com cor diferente
      { token: 'variable.declaration', foreground: isDark ? colors.accentBlueDark : colors.accentBlueLight },
      { token: 'variable.other.member', foreground: isDark ? colors.accentGreenDark : colors.accentGreenLight }, // Propriedades de objeto
      { token: 'variable.other.constant', foreground: isDark ? colors.accentPinkDark : colors.accentPinkLight }, // Constantes (uppercase)

      // --- Funções & Classes ---
      { token: 'entity.name.function', foreground: isDark ? colors.accentPinkDark : colors.accentPinkLight, fontStyle: 'italic' },
      { token: 'entity.name.class', foreground: isDark ? colors.accentGreenDark : colors.accentGreenLight, fontStyle: 'bold' },
      { token: 'entity.name.type', foreground: isDark ? colors.accentGreenDark : colors.accentGreenLight },
      { token: 'entity.other.inherited-class', foreground: isDark ? colors.accentGreenDark : colors.accentGreenLight, fontStyle: 'italic bold' },
      { token: 'support.function', foreground: isDark ? colors.accentPurpleDark : colors.accentPurpleLight }, // Funções built-in
      { token: 'support.class', foreground: isDark ? colors.accentGreenDark : colors.accentGreenLight }, // Classes built-in
      { token: 'support.type', foreground: isDark ? colors.accentGreenDark : colors.accentGreenLight }, // Tipos built-in

      // --- Tipos ---
      { token: 'type.identifier', foreground: isDark ? colors.accentGreenDark : colors.accentGreenLight },
      { token: 'type.primitive', foreground: isDark ? colors.accentGreenDark : colors.accentGreenLight },

      // --- Delimiters & Brackets ---
      { token: 'delimiter', foreground: isDark ? colors.fgSecondaryDark : colors.fgSecondaryLight },
      { token: 'delimiter.square', foreground: isDark ? colors.accentPurpleDark : colors.accentPurpleLight },
      { token: 'delimiter.curly', foreground: isDark ? colors.accentPinkDark : colors.accentPinkLight },
      { token: 'delimiter.parenthesis', foreground: isDark ? colors.accentBlueDark : colors.accentBlueLight },
      { token: 'punctuation', foreground: isDark ? colors.fgSecondaryDark : colors.fgSecondaryLight },

      // --- HTML & XML specific ---
      { token: 'tag', foreground: isDark ? colors.accentPurpleDark : colors.accentPurpleLight },
      { token: 'tag.html', foreground: isDark ? colors.accentPurpleDark : colors.accentPurpleLight },
      { token: 'tag.xml', foreground: isDark ? colors.accentPurpleDark : colors.accentPurpleLight },
      { token: 'metatag', foreground: isDark ? colors.accentPurpleDark : colors.accentPurpleLight },
      { token: 'attribute.name', foreground: isDark ? colors.accentBlueDark : colors.accentBlueLight },
      { token: 'attribute.value', foreground: isDark ? colors.accentOrangeDark : colors.accentOrangeLight },

      // --- CSS specific ---
      { token: 'tag.css', foreground: isDark ? colors.accentPurpleDark : colors.accentPurpleLight },
      { token: 'attribute.name.css', foreground: isDark ? colors.accentGreenDark : colors.accentGreenLight },
      { token: 'attribute.value.css', foreground: isDark ? colors.fgPrimaryDark : colors.fgPrimaryLight },
      { token: 'attribute.value.number.css', foreground: isDark ? colors.accentGreenDark : colors.accentGreenLight },
      { token: 'attribute.value.unit.css', foreground: isDark ? colors.accentGreenDark : colors.accentGreenLight },
      { token: 'keyword.other.unit', foreground: isDark ? colors.accentGreenDark : colors.accentGreenLight },

      // --- JSON specific ---
      { token: 'string.key.json', foreground: isDark ? colors.accentBlueDark : colors.accentBlueLight },
      { token: 'string.value.json', foreground: isDark ? colors.accentOrangeDark : colors.accentOrangeLight },

      // --- Markdown specific ---
      { token: 'markup.heading', foreground: isDark ? colors.accentPurpleDark : colors.accentPurpleLight, fontStyle: 'bold' },
      { token: 'markup.italic', fontStyle: 'italic' },
      { token: 'markup.bold', fontStyle: 'bold' },
      { token: 'markup.underline', fontStyle: 'underline' },
      { token: 'markup.strikethrough', fontStyle: 'strikethrough' },
      { token: 'markup.inline.raw', foreground: isDark ? colors.accentOrangeDark : colors.accentOrangeLight }, // Code block inline
      { token: 'markup.list', foreground: isDark ? colors.accentBlueDark : colors.accentBlueLight },
      { token: 'markup.quote', foreground: isDark ? colors.fgSecondaryDark : colors.fgSecondaryLight, fontStyle: 'italic' },
      
      // --- Invalid / Error ---
      { token: 'invalid', foreground: colors.accentRedLight, background: isDark ? '#f8514930' : '#ffcec660' },
      { token: 'invalid.deprecated', foreground: colors.accentRedLight, fontStyle: 'strikethrough' },

    ],
    colors: {
      'editor.background': isDark ? colors.bgTransparent : colors.bgTransparentLight,
      'editor.foreground': isDark ? colors.fgPrimaryDark : colors.fgPrimaryLight,
      'editorLineNumber.foreground': isDark ? colors.lineNumberFgDark : colors.lineNumberFgLight,
      'editorLineNumber.activeForeground': isDark ? colors.lineNumberActiveFgDark : colors.lineNumberActiveFgLight,
      'editorGutter.background': colors.gutterBg,
      'editorCursor.foreground': colors.cursorColor,
      'editor.selectionBackground': isDark ? colors.selectionBgDark : colors.selectionBgLight,
      'editor.inactiveSelectionBackground': isDark ? '#3a3d4180' : '#e5e5e580', // Mais transparente inativo
      'editor.wordHighlightBackground': '#57575740',
      'editor.wordHighlightStrongBackground': '#00497240',
      'editor.findMatchBackground': '#a8ac9460',
      'editor.findMatchHighlightBackground': '#ea5c0055',
      'editor.hoverHighlightBackground': '#264f7840',
      'editorLink.activeForeground': colors.accentBlueLight,
      'editorWhitespace.foreground': isDark ? '#ffffff1a' : '#33333333',
      'editorIndentGuide.background': isDark ? '#ffffff1a' : '#33333333',
      'editorIndentGuide.activeBackground': isDark ? '#ffffff33' : '#33333366',
      'editorRuler.foreground': isDark ? '#ffffff1a' : '#33333333',
      'editorBracketMatch.background': '#0064001a',
      'editorBracketMatch.border': '#888888',
      // Widgets
      'editorWidget.background': isDark ? colors.widgetBgDark : colors.widgetBgLight,
      'editorWidget.border': isDark ? colors.widgetBorderDark : colors.widgetBorderLight,
      'editorSuggestWidget.background': isDark ? colors.widgetBgDark : colors.widgetBgLight,
      'editorSuggestWidget.border': isDark ? colors.widgetBorderDark : colors.widgetBorderLight,
      'editorHoverWidget.background': isDark ? colors.widgetBgDark : colors.widgetBgLight,
      'editorHoverWidget.border': isDark ? colors.widgetBorderDark : colors.widgetBorderLight,
      // Scrollbar
      'scrollbar.shadow': '#00000000', // Sem sombra
      'scrollbarSlider.background': isDark ? colors.scrollbarBgDark : colors.scrollbarBgLight,
      'scrollbarSlider.hoverBackground': isDark ? colors.scrollbarHoverDark : colors.scrollbarHoverLight,
      'scrollbarSlider.activeBackground': isDark ? colors.scrollbarActiveDark : colors.scrollbarActiveLight,
      // Diff Editor
      'diffEditor.insertedTextBackground': colors.diffInsertedBgDark,
      'diffEditor.removedTextBackground': colors.diffRemovedBgDark,
      // Outros
      'peekViewResult.background': '#252526cc',
      'peekViewEditor.background': '#1e1e1ecc',
      'peekViewTitle.background': '#353536cc',
    },
  };
}; 