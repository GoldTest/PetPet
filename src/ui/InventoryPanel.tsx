import { ShoppingBag } from 'lucide-react';
import type { ItemDisplay } from '../core/mod';
import type { Inventory, ItemId } from '../core/pet';
import { t } from '../i18n';
import { getItemEffectBadges, getItemEffectTitle } from './itemEffectBadges';

interface InventoryPanelProps {
  ownedItems: readonly ItemDisplay[];
  inventory: Inventory;
  itemIconMap: Record<ItemId, string>;
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
          return (
            <button type="button" key={item.id} className="inventory-item" onClick={() => onUseItem(item.id)} title={getItemEffectTitle(item.displaySummary, item.effect)}>
              <img src={itemIconMap[item.id]} alt="" aria-hidden="true" />
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
                <small>{item.displaySummary}</small>
              </div>
              <strong>x{inventory[item.id]}</strong>
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
