export type MenuItem = {
  name: string;
  description: string;
  price: string;
  image: string;
  /** optional second photo that crossfades with the first */
  image2?: string;
  alt: string;
  /** optional photo frame shape, e.g. "3/4" (defaults to square) */
  aspect?: string;
  objectPosition?: string;
};

export type MenuTab = { id: string; label: string; items: MenuItem[] };

export const menu: MenuTab[] = [
  {
    id: "cakes",
    label: "Cakes",
    items: [
      {
        name: "Choco Chip Dream Cake",
        description: "Velvety chocolate cream layered with mini chocolate chips. A chocolate lover's dream.",
        price: "₹ 700+",
        image: "/cakes/choco-chip.png",
        alt: "Choco Chip Dream Cake",
      },
      {
        name: "Sunshine Birthday Cake",
        description: "Pineapple glaze, white whipped cream rosettes and a sparkling Happy Birthday topper.",
        price: "₹ 600+",
        image: "/cakes/sunshine-birthday.png",
        alt: "Sunshine Birthday Cake",
      },
      {
        name: "Strawberry Cream Cake",
        description: "Fluffy white cream with a rich strawberry compote top and berry-piped border.",
        price: "₹ 650+",
        image: "/cakes/strawberry-cream.png",
        alt: "Strawberry Cream Cake",
      },
      {
        name: "Caramel Drip Cake",
        description: "Glossy caramel top, mocha cream rosettes and chocolate drip, personalised with a name.",
        price: "₹ 750+",
        image: "/cakes/caramel-drip.png",
        alt: "Caramel Drip Cake",
      },
      {
        name: "Pineapple Pistachio Cake",
        description: "Pineapple glaze, vanilla cream ruffles and crushed pistachio, finished with a white chocolate heart.",
        price: "₹ 700+",
        image: "/cakes/pineapple-pistachio.png",
        alt: "Pineapple Pistachio Cake",
      },
      {
        name: "Chocolate Truffle Cake",
        description: "Dense dark chocolate ganache with piped chocolate peaks and choco-chip details.",
        price: "₹ 800+",
        image: "/cakes/chocolate-truffle.png",
        alt: "Chocolate Truffle Cake",
      },
      {
        name: "Almond Birthday Cake",
        description: "Toasted almond flakes all around, pineapple topping and a golden Happy Birthday topper.",
        price: "₹ 750+",
        image: "/cakes/almond-birthday.png",
        alt: "Almond Birthday Cake",
      },
      {
        name: "Almond Pineapple Cake",
        description: "Whipped cream rosettes, pineapple chunks and a crunchy almond-flake finish.",
        price: "₹ 700+",
        image: "/cakes/almond-pineapple.png",
        alt: "Almond Pineapple Cake",
      },
      {
        name: "Basket-Weave Name Cake",
        description: "Butter-cream basket weave in pale yellow with a hand-piped name. Fully personalised.",
        price: "₹ 750+",
        image: "/cakes/basket-weave.png",
        alt: "Basket-Weave Name Cake",
      },
      {
        name: "Marble Cake",
        description: "A classic two-toned swirl of vanilla and chocolate sponge, baked golden. Soft, moist and perfect with tea.",
        price: "Price on request",
        image: "/cakes/marble-cake.jpg",
        alt: "Marble Cake",
      },
      {
        name: "Chocolate Cake",
        description: "Cream-covered cake with a glossy chocolate drip and a personalised message on top.",
        price: "Price on request",
        image: "/cakes/chocolate-drip-cake.jpg",
        alt: "Chocolate Cake",
      },
      {
        name: "Tutti Frutti Dry Cake",
        description: "A buttery dry cake studded with colourful tutti frutti. A tea-time favourite that keeps well.",
        price: "Price on request",
        image: "/cakes/tutti-frutti-dry-cake.jpg",
        alt: "Tutti Frutti Dry Cake",
      },
      {
        name: "Pineapple Dry Fruit Cake",
        description: "Whipped cream topped with pineapple, kiwi and grapes, with a crunchy almond-flake side.",
        price: "Price on request",
        image: "/cakes/pineapple-dry-fruit-cake.jpg",
        alt: "Pineapple Dry Fruit Cake",
      },
    ],
  },
  {
    id: "muffins",
    label: "Cupcakes & Muffins",
    items: [
      {
        name: "Choco Chip Cookie Cupcakes",
        description: "Chocolate cupcakes topped with swirled cookie cream and mini chocolate chips.",
        price: "₹ 40 per pc",
        image: "/cakes/choco-chip-cookie.png",
        alt: "Choco Chip Cookie Cupcakes",
      },
      {
        name: "Cookies & Cream Cupcakes",
        description: "Chocolate cupcakes with cookies and cream swirls, crushed cookie crumble and a cookie on top.",
        price: "₹ 30 per pc",
        image: "/cakes/cookies-cream.png",
        alt: "Cookies & Cream Cupcakes",
      },
      {
        name: "Tutti Frutti Muffins",
        description: "Soft, fluffy vanilla muffins dotted with colourful tutti frutti. A happy treat for all ages.",
        price: "₹ 25 per pc",
        image: "/cakes/tutti-frutti.png",
        alt: "Tutti Frutti Muffins",
      },
    ],
  },
  {
    id: "breads",
    label: "Breads & Bakes",
    items: [
      {
        name: "Buns",
        description: "Soft, golden dinner buns baked fresh in a tin. Pillowy inside with a light buttery shine.",
        price: "Price on request",
        image: "/cakes/buns.jpg",
        image2: "/cakes/buns-2.jpg",
        alt: "Buns",
        objectPosition: "center",
      },
      {
        name: "Focaccia",
        description: "Fluffy, herb-topped focaccia with a crisp base. Great as a snack or with soup.",
        price: "Price on request",
        image: "/cakes/focaccia.jpg",
        image2: "/cakes/focaccia-2.jpg",
        alt: "Focaccia",
        objectPosition: "center",
      },
      {
        name: "Pizza",
        description: "Tray-baked pizza on a freshly made base, loaded with vegetables, olives and cheese.",
        price: "Price on request",
        image: "/cakes/pizza.jpg",
        image2: "/cakes/pizza-2.jpg",
        alt: "Pizza",
        objectPosition: "center",
      },
      {
        name: "Sandwich Bread",
        description: "Soft sliced sandwich bread with a tender crumb, baked fresh for everyday use.",
        price: "Price on request",
        image: "/cakes/sandwich-bread.jpg",
        alt: "Sandwich Bread",
      },
      {
        name: "Japanese Shokupan (Milk Bread)",
        description: "Ultra-soft, fluffy Japanese milk bread with a golden crust. Perfect for toast and sandwiches.",
        price: "Price on request",
        image: "/cakes/shokupan.jpg",
        alt: "Japanese Shokupan (Milk Bread)",
      },
      {
        name: "Whole Wheat Bread",
        description: "Wholesome whole wheat loaf, soft inside with a lightly crisp crust. Freshly sliced.",
        price: "Price on request",
        image: "/cakes/whole-wheat-bread.jpg",
        alt: "Whole Wheat Bread",
      },
    ],
  },
  {
    id: "specials",
    label: "Special Orders",
    items: [
      {
        name: "Doll Cake",
        description: "A doll-shaped celebration cake with a soft pink rosette gown, golden pearl details and a bow. Made to order for birthdays, with your choice of flavour.",
        price: "₹ 1400 / kg",
        image: "/cakes/doll-cake.jpg",
        alt: "Doll cake with pink rosette gown",
        aspect: "3/4",
        objectPosition: "center",
      },
      {
        name: "Rose Ribbon Tier Cake",
        description: "A two-tier cream cake with soft pink piping, dried rose petals and satin ribbon bows. Made to order for celebrations.",
        price: "₹ 3000 / 2 kg",
        image: "/cakes/rose-ribbon-tier.jpg",
        alt: "Two-tier cake with pink piping, rose petals and red ribbon bows",
        aspect: "3/4",
      },
      {
        name: "Checkerboard Cake",
        description: "Vanilla and chocolate sponge baked in a checkerboard pattern, covered in cream with soft lemon-cream rosettes on top. Made to order.",
        price: "₹ 900 / kg",
        image: "/cakes/checkerboard-cake.jpg",
        image2: "/cakes/checkerboard-cake-2.jpg",
        alt: "Checkerboard cake with cream rosettes, sliced to show the pattern",
        aspect: "3/4",
        objectPosition: "65% center",
      },
    ],
  },
];
