import React, { Fragment } from 'react';
import { Disclosure, Transition } from '@headlessui/react';
import { FiChevronDown } from 'react-icons/fi';
// Removido useTheme, vamos usar classes Tailwind que respondem ao tema global

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ElementType;
  defaultOpen?: boolean;
  children?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  panelClassName?: string;
  titleClassName?: string; // Classe para o texto do título
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
    title,
    icon: Icon,
    defaultOpen = false,
    children,
    className = '',
    headerClassName = '',
    panelClassName = '',
    titleClassName = '' // Nova prop para estilizar o título
}) => {
  // --- Estilos Refinados ---
  const sectionContainerClasses = `
    py-2 border-b border-border/30 dark:border-border-dark/30 /* Borda inferior sutil e translúcida */
    ${className}
  `;

  const disclosureButtonClasses = `
    flex justify-between items-center w-full px-2 py-1.5 /* Ajuste de padding */
    text-left rounded-md
    hover:bg-white/5 dark:hover:bg-black/10 /* Hover sutil e translúcido */
    focus:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:focus-visible:ring-accent-dark focus-visible:ring-opacity-60
    transition-colors duration-150
    ${headerClassName}
  `;

  const titleTextClasses = `
    uppercase text-xs tracking-wider font-semibold truncate
    text-text-muted dark:text-text-darkMuted /* Cor padrão do título */
    group-hover:text-text dark:group-hover:text-text-dark /* Cor do título no hover do botão */
    ${titleClassName}
  `;

  const iconClasses = `
    w-4 h-4 flex-shrink-0
    text-text-muted/80 dark:text-text-darkMuted/80 /* Cor padrão do ícone */
    group-hover:text-text-muted dark:group-hover:text-text-darkMuted /* Cor do ícone no hover do botão */
  `;

  const chevronIconClasses = (open: boolean) => `
    w-4 h-4 flex-shrink-0 transform transition-transform duration-200
    text-text-muted/80 dark:text-text-darkMuted/80
    group-hover:text-text-muted dark:group-hover:text-text-darkMuted
    ${open ? 'rotate-180' : ''}
  `;

  const disclosurePanelClasses = `
    px-2 pt-2.5 pb-1.5 text-sm overflow-hidden /* Ajuste de padding */
    text-text dark:text-text-dark /* Cor base para o conteúdo do painel */
    ${panelClassName}
  `;
  // --- Fim dos Estilos Refinados ---

  return (
    <Disclosure defaultOpen={defaultOpen}>
      {({ open }: { open: boolean }) => (
        // APLICADO sectionContainerClasses
        <div className={sectionContainerClasses}>
            {/* Adicionado 'group' para que o hover no botão possa afetar os filhos (título, ícones) */}
            <Disclosure.Button className={`group ${disclosureButtonClasses}`}>
                <div className="flex items-center space-x-2">
                    {Icon && <Icon className={iconClasses} />}
                    {/* APLICADO titleTextClasses */}
                    <span className={titleTextClasses}>{title}</span>
                </div>
              <FiChevronDown
                    className={chevronIconClasses(open)}
                />
            </Disclosure.Button>

          {children && (
            <Transition
              as={Fragment}
              show={open}
              enter="transition-[max-height,opacity] duration-200 ease-out"
              enterFrom="opacity-0 max-h-0"
              enterTo="opacity-100 max-h-[1000px]"
              leave="transition-[max-height,opacity] duration-150 ease-in"
              leaveFrom="opacity-100 max-h-[1000px]"
              leaveTo="opacity-0 max-h-0"
            >
              <Disclosure.Panel static className={disclosurePanelClasses}>
                {children}
              </Disclosure.Panel>
            </Transition>
          )}
        </div>
      )}
    </Disclosure>
  );
}; 