export const generateDummyProducts = () => {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return [
    {
      name: "2MP Full HD Bullet Outdoor Camera",
      sku: `CAM-HIK-2MP-${rand}`,
      stock: 25,
      min_stock: 5,
      status: "active",
      condition: "New",
      description: "Hikvision 2MP High Performance Bullet Camera with night vision.",
    },
    {
      name: "Archer C6 Gigabit Wireless Router",
      sku: `RTR-TPL-C6-${rand}`,
      stock: 14,
      min_stock: 3,
      status: "active",
      condition: "New",
      description: "TP-Link Dual Band Gigabit WiFi Router.",
    },
    {
      name: "4 Channel Full HD DVR Recorder",
      sku: `DVR-HIK-4CH-${rand}`,
      stock: 8,
      min_stock: 2,
      status: "active",
      condition: "New",
      description: "Hikvision 4 Channel HD Real-time Recording DVR.",
    },
    {
      name: "2TB SkyHawk Surveillance Hard Disk",
      sku: `HDD-SEA-2TB-${rand}`,
      stock: 12,
      min_stock: 4,
      status: "active",
      condition: "New",
      description: "Seagate SkyHawk Surveillance Internal Hard Drive.",
    },
    {
      name: "16 Port Fast Ethernet Desktop Switch",
      sku: `SW-DLK-16P-${rand}`,
      stock: 6,
      min_stock: 2,
      status: "active",
      condition: "New",
      description: "D-Link 16-Port Fast Ethernet Unmanaged Network Switch.",
    },
  ];
};
