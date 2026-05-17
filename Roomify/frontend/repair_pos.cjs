const fs = require('fs');
const path = 'src/pages/RestaurantPOS.tsx';
let c = fs.readFileSync(path, 'utf8');
const lines = c.split('\n');

// Fix the corruption: lines 59-76 (0-indexed 59-75) are broken
// Need to replace with correct content
const fixed = [
  ...lines.slice(0, 59), // keep lines 0-58 intact
  "  const [newItem, setNewItem] = useState({\r",
  "    name: '',\r",
  "    category: 'Mains' as Exclude<MenuCategory, 'All' | 'Best Sellers'>,\r",
  "    price: '',\r",
  "    image_url: '',\r",
  "    description: '',\r",
  "    is_bestseller: false,\r",
  "    is_chef_pick: false,\r",
  "    is_dessert_week: false\r",
  "  });\r",
  "\r",
  "  const userRole = (localStorage.getItem('role') || '').toLowerCase();\r",
  "  const isAdmin = userRole === 'admin';\r",
  "  const [activeTab, setActiveTab] = useState<'pos' | 'room-orders'>('pos');\r",
  "  const [roomOrders, setRoomOrders] = useState<RoomOrder[]>([]);\r",
  "  const [roomOrdersLoading, setRoomOrdersLoading] = useState(false);\r",
  "  const [servingId, setServingId] = useState<number | null>(null);\r",
  "  const [roomOrderMsg, setRoomOrderMsg] = useState('');\r",
  "\r",
  "  useEffect(() => {\r",
  "    const fetchRooms = async () => {\r",
  "      try {\r",
  "        const token = localStorage.getItem('token');\r",
  ...lines.slice(64) // resume from the fetch line that was misplaced
];

fs.writeFileSync(path, fixed.join('\n'), 'utf8');
console.log('Fixed! Lines now:', fixed.length);
