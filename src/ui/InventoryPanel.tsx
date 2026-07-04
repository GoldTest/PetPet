import { ShoppingBag } from 'lucide-react';
import type { Inventory, InventoryItemDefinition, ItemId } from '../core/pet';
import { unknownItemIcon } from '../assets';
import { t } from '../i18n';
import { getItemEffectBadges, getItemEffectTitle } from './itemEffectBadges';

interface InventoryPanelProps {
  ownedItems: readonly InventoryItemDefinition[];
  inventory: Inventory;
  itemIconMap: Partial<Record<string, string>>;
  onOpenShop: () => void;
  onUseItem: (itemId: ItemId) => void;
}

export const InventoryPanel = ({ ownedItems, inventory, itemIconMap, onOpenShop, onUseItem }: InventoryPanelProps) => (
  <section className="inventory-panel" aria-label={t('ui.inventory.aria')}>
    <header>
      <div>
        <span className="panel-kicker">{t('ui.inventory.kicker')}</span>
        <h2>{t('ui.inventory.title')}</h2>
      </div>
      <button type="button" className="text-button text-button--accent" onClick={onOpenShop}>
        <ShoppingBag size={17} aria-hidden="true" />
        {t('ui.inventory.shop')}
      </button>
    </header>

    {ownedItems.length > 0 ? (
      <div className="inventory-list">
        {ownedItems.map((item) => {
          const effectBadges = getItemEffectBadges(item.effect);
          const icon = itemIconMap[item.id] ?? item.imageUrl ?? unknownItemIcon;
          return (
            <button type="button" key={item.id} className="inventory-item" disabled={!item.usable} onClick={() => onUseItem(item.id)} title={getItemEffectTitle(item.displaySummary, item.effect)}>
              <span className="inventory-item__icon-wrap">
                <img src={icon} alt="" aria-hidden="true" />
                <strong className="inventory-item__count">x{inventory[item.id]}</strong>
              </span>
              <div className="inventory-item__copy">
                <div className="inventory-item__title-row">
                  <span className="inventory-item__name">{item.displayName}</span>
                  {effectBadges.length > 0 && (
                    <span className="inventory-effect-badges" aria-label={effectBadges.map((badge) => badge.label).join(', ')}>
                      {effectBadges.map((badge) => (
                        <span className="inventory-effect-badge" key={badge.key}>
                          {badge.label}
                        </span>
                      ))}
                    </span>
                  )}
                </div>
                <small className="inventory-item__summary">{item.displaySummary}</small>
              </div>
            </button>
          );
        })}
      </div>
    ) : (
      <div className="empty-state">
        <span>{t('ui.inventory.empty')}</span>
      </div>
    )}
  </section>
);
