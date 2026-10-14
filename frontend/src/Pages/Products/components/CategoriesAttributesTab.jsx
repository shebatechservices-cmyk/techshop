import React, { useState, useMemo } from "react";
import ManageUomModal from "../modals/ManageUomModal";
import { filterAttributeItems } from "./categories/attributeHierarchyHelpers";
import AttributeCatalogHeader from "./categories/AttributeCatalogHeader";
import AttributeFilterToolbar from "./categories/AttributeFilterToolbar";
import AttributePanelCard from "./categories/AttributePanelCard";

export default function CategoriesAttributesTab({
  categories = [],
  subCategories = [],
  brands = [],
  productNames = [],
  models = [],
  series = [],
  showAttributeAdd,
  setShowAttributeAdd,
  attributeDraft,
  setAttributeDraft,
  attributeError,
  setAttributeError,
  saveAttributeItem,
  openQuickEditModal,
  openQuickAddModal,
  deleteAttribute,
}) {
  const [isManageUomOpen, setIsManageUomOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntityFilter, setSelectedEntityFilter] = useState("ALL");

  const totalAttributesCount =
    categories.length +
    subCategories.length +
    brands.length +
    productNames.length +
    models.length +
    series.length;

  const panels = useMemo(
    () => [
      {
        entity: "categories",
        title: "Categories",
        description: "Primary department or product classification group",
        items: categories,
        accentBorder: "border-t-amber-500",
      },
      {
        entity: "sub_categories",
        title: "Sub-categories",
        description: "Inner sub-grouping under main categories",
        items: subCategories,
        accentBorder: "border-t-teal-500",
      },
      {
        entity: "brands",
        title: "Brands",
        description: "Manufacturers and brand partners",
        items: brands,
        accentBorder: "border-t-blue-500",
      },
      {
        entity: "product_names",
        title: "Product Names",
        description: "Base product name / core equipment types",
        items: productNames,
        accentBorder: "border-t-emerald-500",
      },
      {
        entity: "models",
        title: "Models",
        description: "Specific hardware models per brand",
        items: models,
        accentBorder: "border-t-purple-500",
      },
      {
        entity: "series",
        title: "Series",
        description: "Product family or collection lines",
        items: series,
        accentBorder: "border-t-orange-500",
      },
    ],
    [categories, subCategories, brands, productNames, models, series]
  );

  const lookupContext = useMemo(
    () => ({ categories, subCategories, brands, models }),
    [categories, subCategories, brands, models]
  );

  const hasActiveFilters = Boolean(searchQuery.trim() || selectedEntityFilter !== "ALL");

  const handleResetAll = () => {
    setSearchQuery("");
    setSelectedEntityFilter("ALL");
  };

  const visiblePanels = panels.filter(
    (p) => selectedEntityFilter === "ALL" || p.entity === selectedEntityFilter
  );

  const totalFilteredCount = visiblePanels.reduce(
    (sum, p) => sum + filterAttributeItems(p.entity, p.items, searchQuery, lookupContext).length,
    0
  );

  return (
    <div className="space-y-4">
      <AttributeCatalogHeader
        totalAttributesCount={totalAttributesCount}
        panels={panels}
        selectedEntityFilter={selectedEntityFilter}
        setSelectedEntityFilter={setSelectedEntityFilter}
        onOpenManageUom={() => setIsManageUomOpen(true)}
      />

      <AttributeFilterToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedEntityFilter={selectedEntityFilter}
        setSelectedEntityFilter={setSelectedEntityFilter}
        totalAttributesCount={totalAttributesCount}
        categories={categories}
        subCategories={subCategories}
        brands={brands}
        productNames={productNames}
        models={models}
        series={series}
        panels={panels}
        hasActiveFilters={hasActiveFilters}
        handleResetAll={handleResetAll}
        totalFilteredCount={totalFilteredCount}
      />

      {/* Grid of Attribute Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visiblePanels.map(({ entity, title, description, items, accentBorder }) => {
          const filteredItems = filterAttributeItems(entity, items, searchQuery, lookupContext);
          const isSearching = Boolean(searchQuery.trim());

          return (
            <AttributePanelCard
              key={entity}
              entity={entity}
              title={title}
              description={description}
              items={items}
              filteredItems={filteredItems}
              accentBorder={accentBorder}
              isSearching={isSearching}
              lookupContext={lookupContext}
              showAttributeAdd={showAttributeAdd}
              setShowAttributeAdd={setShowAttributeAdd}
              attributeDraft={attributeDraft}
              setAttributeDraft={setAttributeDraft}
              attributeError={attributeError}
              setAttributeError={setAttributeError}
              saveAttributeItem={saveAttributeItem}
              openQuickEditModal={openQuickEditModal}
              openQuickAddModal={openQuickAddModal}
              deleteAttribute={deleteAttribute}
              categories={categories}
            />
          );
        })}
      </div>

      {/* Standalone Manage UOM Modal */}
      <ManageUomModal
        isOpen={isManageUomOpen}
        onClose={() => setIsManageUomOpen(false)}
      />
    </div>
  );
}
