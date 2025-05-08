const tsconfig = require("./tsconfig.json");
const moduleNameMapper = require("tsconfig-paths-jest")(tsconfig);

module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".", // Raiz agora é a própria pasta 'backend'
  testEnvironment: "node",
  testRegex: ".e2e-spec.ts$", // Procurar testes e2e em qualquer lugar dentro de 'backend'
  transform: {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  // Usar tsconfig-paths-jest para mapear automaticamente os alias do tsconfig.json
  moduleNameMapper,
  // Opcional: Setup file
  // setupFilesAfterEnv: ["<rootDir>/test/setup-e2e.ts"] 
}; 