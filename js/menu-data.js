// Dados reais do cardápio do Edson Sushi (extraídos do sistema de pedidos do restaurante)
const S3 = "https://s3.us-west-2.amazonaws.com/whatsmenu/production/edsonsushi/products/";
const S3B = "https://whatsmenu.s3.amazonaws.com/production/edsonsushi/products/";

const MENU = [
  {
    cat: "Promoções",
    icon: "bi-fire",
    items: [
      { n: "20 Unidades de Hot Roll de Salmão", d: "Salmão, kani, cream cheese e cebolinha", v: 59.99, img: S3 + "2320014/edsonsushimngMHkj4hPLVNbawebp" },
      { n: "1 Temaki + 1 Bebida", d: "Não entra temaki de camarão nem temaki sem arroz", v: 34.99, img: S3B + "3409262/ChatGPTImage17dejun" }
    ]
  },
  {
    cat: "Temakis",
    icon: "bi-egg-fried",
    items: [
      { n: "Salmão Completo", d: "Salmão, cream cheese e cebolinha", v: 32.90, img: S3 + "1219566/edsonsushiJp1KYIEK7JNsmLcwebp", featured: true },
      { n: "Salmão Nachos", d: "Salmão, cream cheese, cebolinha e doritos", v: 33.90, img: S3 + "1219567/edsonsushicemqraysazbyxjpwebp" },
      { n: "Salmão com Shimeji", d: "Salmão, cream cheese, cebolinha e shimeji", v: 30.90, img: S3 + "1219568/edsonsushin9lbcqmirrewbm4webp" },
      { n: "Salmão com Camarão Empanado", d: "Salmão cru, cream cheese, cebolinha e camarão empanado", v: 33.90, img: S3 + "1219569/edsonsushi3lpk74izec5ktwmwebp" },
      { n: "Salmão Empanado", d: "Salmão empanado, cream cheese e cebolinha", v: 32.90, img: S3 + "1219571/edsonsushimmmib5aws3dppvlwebp" },
      { n: "Salmão Grelhado", d: "Salmão, cream cheese e cebolinha", v: 32.90, img: S3 + "1219570/edsonsushinydu7f8sodfyql0webp" },
      { n: "Salmão Spicy", d: "Salmão, cream cheese, cebolinha e pimenta", v: 32.90, img: S3 + "1219572/edsonsushiaw4pj05cyfwos75webp" },
      { n: "Camarão Empanado", d: "Camarão empanado, cream cheese e cebolinha", v: 34.90, img: S3 + "1219579/edsonsushic93uciurw8a4eqdwebp" },
      { n: "Hot Roll", d: "Temaki empanado, cream cheese e cebolinha", v: 34.90, promo: 28.99, img: S3 + "1219582/edsonsushikf3axcctqf1rp7jwebp", featured: true },
      { n: "Shimeji", d: "Shimeji, cream cheese e cebolinha", v: 29.90, img: S3 + "1219583/edsonsushiagbahiibphslvcwwebp" },
      { n: "Skin", d: "Pele do salmão frita, cream cheese e cebolinha", v: 27.90, img: S3 + "1219584/edsonsushisklnwozj3ovfu4lwebp" },
      { n: "Chico César", d: "Salmão grelhado, cream cheese, cebolinha e couve frita", v: 32.90, img: S3 + "1219585/edsonsushi9w66pykdwkfqfz7webp" },
      { n: "Peixe Branco", d: "Peixe branco, cream cheese e cebolinha", v: 32.90, img: S3 + "1219586/edsonsushi02w7qiw7rdyra93webp" },
      { n: "California", d: "Pepino, manga, kani e cream cheese", v: 27.90, img: S3 + "1219587/edsonsushimvmd35vjlisdytwwebp" },
      { n: "Peixe Branco Empanado", d: "Peixe branco, cream cheese e cebolinha", v: 32.90, img: S3 + "1243045/edsonsushiheulwucoycmdya7webp" },
      { n: "Sem Arroz", d: "Sabor à sua escolha", v: 44.90, img: S3 + "1235669/edsonsushiZkDNxbTg0gK71yZwebp" },
      { n: "Especial", d: "Salmão, cream cheese, molho tarê e amêndoas laminadas", v: 34.90, img: S3B + "3409378/ChatGPTImage17dejun" }
    ]
  },
  {
    cat: "Uramakis",
    sub: "10 unidades",
    icon: "bi-flower1",
    items: [
      { n: "Uramaki de Salmão", d: "Salmão, cream cheese e cebolinha", v: 31.90, img: S3 + "1219588/edsonsushiUQaBF11vjAJitxpwebp" },
      { n: "Uramaki California", d: "Pepino, manga, kani e cream cheese", v: 27.90, img: S3 + "1219589/edsonsushiehlbiitv1p073zzwebp" },
      { n: "Uramaki Skin", d: "Pele do salmão frita, cream cheese e cebolinha", v: 24.90, img: S3 + "1219590/edsonsushig93sfkgqjhqmudqwebp" },
      { n: "Uramaki Crispy", d: "Salmão empanado, cream cheese e cebolinha", v: 31.90, img: S3 + "1219591/edsonsushim1b00ufqudlgy5awebp" },
      { n: "Uramaki Especial", d: "Salmão, kani, cream cheese, cebolinha e uma fita de salmão por cima", v: 32.90, img: S3 + "1219592/edsonsushif3z4ztqnewv0v0iwebp" },
      { n: "Uramaki de Camarão", d: "Camarão, cream cheese e cebolinha", v: 32.90, img: S3 + "1219594/edsonsushivl2vuhmqbyggn42webp" },
      { n: "Batera de Salmão", d: "Salmão, cream cheese e cebolinha", v: 32.90, img: S3 + "1219595/edsonsushi5ce5g3qmxllki0nwebp" }
    ]
  },
  {
    cat: "Hot Rolls",
    sub: "10 unidades",
    icon: "bi-sun",
    items: [
      { n: "Hot Roll de Salmão", d: "Salmão, kani, cream cheese e cebolinha", v: 32.90, img: S3 + "1219599/edsonsushizohbpwu5itycmjpwebp", featured: true },
      { n: "Hot Roll de Salmão com Shimeji", d: "Salmão, shimeji, cream cheese e cebolinha", v: 31.90, img: S3 + "1219601/edsonsushi6bovvfpexmlueb6webp" },
      { n: "Hot Roll de Salmão com Couve", d: "Salmão, kani, cream cheese, cebolinha finalizado com couve", v: 33.90, img: S3 + "2320002/edsonsushi2Nckpvyh8j3UViTwebp" },
      { n: "Hot Roll de Salmão com Doritos", d: "Salmão, kani, cream cheese, cebolinha finalizado com Doritos", v: 33.90, img: S3 + "2320007/edsonsushiai2kxdnjCeSw60Ywebp" },
      { n: "Hot Roll de Camarão com Salmão", d: "Salmão, camarão, cream cheese e cebolinha", v: 34.90, img: S3 + "1219600/edsonsushijtvc0s8bs9oq3pswebp" }
    ]
  },
  {
    cat: "Mini Hot Roll",
    sub: "10 unidades",
    icon: "bi-stars",
    items: [
      { n: "Mini Hot Roll de Salmão", d: "Salmão cru, cream cheese e cebolinha", v: 32.90, img: S3 + "1219603/edsonsushituaricmmdatfe9twebp" },
      { n: "Mini Hot Roll de Couve", d: "Cream cheese e couve frita", v: 26.90, img: S3 + "1219604/edsonsushiv2jzrwumjchgf1awebp" },
      { n: "Mini Hot Roll de Batata", d: "Cream cheese e batata", v: 26.90, img: S3 + "1219605/edsonsuship4anxmizlq4et0awebp" },
      { n: "Mini Hot Roll de Banana com Nutella", d: "Cream cheese e chocolate", v: 29.90, img: S3B + "1231273/IMG_5396" }
    ]
  },
  {
    cat: "Niguiri",
    sub: "6 unidades",
    icon: "bi-gem",
    items: [
      { n: "Niguiri de Salmão", d: "", v: 28.90, img: S3 + "1219616/edsonsushiSFhZtazCW2xVmBjwebp" },
      { n: "Niguiri Skin", d: "", v: 25.90, img: S3 + "1219617/edsonsushigficlckzhi8qvdpwebp" }
    ]
  },
  {
    cat: "Sashimi",
    sub: "8 unidades",
    icon: "bi-water",
    items: [
      { n: "Sashimi de Salmão", d: "", v: 35.90, img: S3 + "1219621/edsonsushiUsPeU8hKW4m3lpgwebp" }
    ]
  },
  {
    cat: "Hossomaki",
    sub: "10 unidades",
    icon: "bi-circle",
    items: [
      { n: "Hossomaki de Salmão", d: "", v: 26.90, img: S3 + "1219622/edsonsushiV1ZC3cGfAEdC1VMwebp" },
      { n: "Hossomaki de Kani", d: "", v: 22.90, img: S3 + "1219623/edsonsushizr0tzornp0kwgqfwebp" },
      { n: "Hossomaki de Pepino", d: "", v: 22.90, img: S3 + "1219625/edsonsushiixwn6vpegm8lhvgwebp" }
    ]
  },
  {
    cat: "Carpaccio",
    icon: "bi-circle-square",
    items: [
      { n: "Carpaccio de Salmão", d: "10 fatias de salmão", v: 37.90, img: S3 + "1219630/edsonsushi4avl9MeFNGt39tJwebp" }
    ]
  },
  {
    cat: "Teppan",
    icon: "bi-fire",
    items: [
      { n: "Teppan de Salmão", d: "Acompanha arroz e legumes na chapa", v: 52.90, img: S3 + "1219632/edsonsushi5tYjSfieJlPasL8webp" }
    ]
  },
  {
    cat: "Salada Poke",
    icon: "bi-flower2",
    items: [
      { n: "Poke Salmão California", d: "Arroz ou salada, salmão, kani, pepino, manga, cream cheese, couve ou doritos · 350g", v: 43.90, img: S3 + "1219636/edsonsushigaDF7R9M0imPnxjwebp", featured: true },
      { n: "Poke Salmão Empanado", d: "Arroz ou salada, salmão empanado, kani, manga, shimeji, cream cheese, batata ou couve · 350g", v: 44.90, img: S3 + "1219637/edsonsushiswmpxx8lwmqij7kwebp" },
      { n: "Poke Salmão Grelhado", d: "Arroz ou salada, salmão grelhado, kani, pepino, manga, cream cheese, couve ou doritos · 350g", v: 43.90, img: S3B + "3186528/Salada" },
      { n: "Monte sua Salada Poke", d: "Monte do seu jeito", v: 46.90, img: S3B + "3409434/ChatGPTImage17dejun" }
    ]
  },
  {
    cat: "Combos",
    icon: "bi-box-seam",
    items: [
      { n: "2 Temakis + 1 Bebida", d: "Temakis à escolha. Não entra temaki sem arroz e de camarão", v: 55.90, img: S3 + "1219638/edsonsushippr2rxpefniuoiywebp" },
      { n: "8 Jyo Chico César + 1 Temaki", d: "Temaki à escolha. Não entra temaki sem arroz e de camarão", v: 52.90, img: S3B + "1219639/JYO" },
      { n: "1 Temaki + 5 Hot Roll", d: "Temaki à escolha. Não entra temaki sem arroz e de camarão", v: 40.90, img: S3 + "1219640/edsonsushiuntk5mil90h6vakwebp" }
    ]
  },
  {
    cat: "Big Hot Roll",
    icon: "bi-sun-fill",
    items: [
      { n: "Big Hot de Salmão", d: "Salmão, cream cheese, cebolinha, couve ou batata", v: 45.90, img: S3 + "1219642/edsonsushiBLOVBbkwy0zkiLgwebp" },
      { n: "Big Hot de Salmão Grelhado", d: "Salmão grelhado, cream cheese, cebolinha, batata ou couve", v: 45.90, img: S3 + "1219642/edsonsushiBLOVBbkwy0zkiLgwebp" },
      { n: "Big Hot de Shimeji com Salmão", d: "Salmão, shimeji, cream cheese, cebolinha, couve ou batata", v: 45.90, img: S3 + "1219642/edsonsushiBLOVBbkwy0zkiLgwebp" },
      { n: "Big Hot de Camarão com Salmão", d: "Camarão, salmão, cream cheese, cebolinha, couve ou batata", v: 47.90, img: S3 + "1219642/edsonsushiBLOVBbkwy0zkiLgwebp" }
    ]
  },
  {
    cat: "Sushi Jyo",
    sub: "6 unidades",
    icon: "bi-diamond",
    items: [
      { n: "Jyo de Salmão", d: "Salmão, cream cheese e cebolinha", v: 32.90, img: S3 + "1219647/edsonsushivb4FDgijt5flRiAwebp" },
      { n: "Jyo de Shimeji", d: "Salmão, shimeji, cream cheese e cebolinha", v: 30.90, img: S3 + "1219649/edsonsushibx69rxw78a70aafwebp" },
      { n: "Jyo Chico César", d: "Salmão, cream cheese e couve frita", v: 30.90, img: S3 + "1219650/edsonsushilf3jz4trg98y8vuwebp", featured: true },
      { n: "Jyo de Batata", d: "Salmão, cream cheese e batata", v: 30.90, img: S3 + "1219651/edsonsushiozusnwgbbnuydjzwebp" },
      { n: "Jyo de Doritos", d: "Arroz, salmão, cream cheese e doritos", v: 30.90, img: S3B + "1246838/Semtitulo" }
    ]
  },
  {
    cat: "Pratos Quentes",
    icon: "bi-cup-hot",
    items: [
      { n: "Guioza", d: "6 unidades", v: 27.90, img: S3 + "1219657/edsonsushi01sn3gtxpenal8hwebp" }
    ]
  },
  {
    cat: "Combinados Variados",
    icon: "bi-grid-3x3-gap",
    items: [
      { n: "30 Peças + 1 Temaki à Escolha", d: "10 uramaki skin, 10 hossomaki de salmão, 10 hot roll, 1 temaki à escolha", v: 75.90, img: S3 + "1219659/edsonsushid709195nsl3ko94webp", featured: true },
      { n: "40 Peças", d: "5 niguiri skin, 5 niguiri salmão, 10 uramaki skin, 10 hossomaki de salmão, 10 hot roll", v: 75.90, img: S3 + "1219660/edsonsushi3doffnjol4trjakwebp" },
      { n: "50 Peças", d: "5 niguiri skin, 5 niguiri salmão, 10 uramaki salmão, 10 uramaki skin, 10 hossomaki salmão, 10 hot roll", v: 85.90, img: S3B + "1219661/713c10ad719e4015a837b77957cec4ef" },
      { n: "60 Peças + 2 Temakis", d: "5 niguiri de salmão, 5 niguiri skin, 10 uramaki salmão, 10 uramaki skin, 10 hossomaki salmão, 10 mini hot roll de couve, 10 hot roll, 2 temakis à escolha", v: 125.90, promo: 119.99, img: S3 + "1219662/edsonsuship3e3xpkwkcodayowebp" }
    ]
  },
  {
    cat: "Combinados",
    icon: "bi-grid-fill",
    items: [
      { n: "Individual 20 Peças", d: "4 sashimis de salmão, 4 uramaki salmão, 4 uramaki skin, 4 hossomaki salmão, 4 hot roll + 1 temaki", v: 75.90, img: S3 + "1219663/edsonsushituaxouvt3xxwrdmwebp" },
      { n: "Combinado Hot", d: "10 hot roll de salmão, 10 mini hot roll de couve, 1 temaki hot roll", v: 75.90, promo: 69.99, img: S3 + "1219665/edsonsushivdajgpfoons94pqwebp" },
      { n: "Combinado do Chefe 1", d: "42 peças: 8 sashimis de salmão, 3 niguiri salmão, 3 niguiri skin, 8 uramaki variado, 8 hossomaki salmão, 3 jyo de salmão, 3 jyo chico césar, 6 hot roll + 2 temakis à escolha, entradas com guioza, harumaki de queijo, rolinho primavera e romeu e julieta", v: 139.90, img: S3 + "1219666/edsonsushijn3xwjztpurmvm7webp" },
      { n: "Combinado do Chefe 2", d: "80 peças: 15 sashimi salmão, 5 niguiri salmão, 5 niguiri skin, 10 uramaki salmão, 10 uramaki skin, 10 hossomaki salmão, 4 jyo salmão, 5 jyo chico césar, 11 hot roll de salmão + 3 temakis, entradas com guioza, harumaki de queijo, rolinho primavera e romeu e julieta", v: 229.90, img: S3 + "1219667/edsonsushiwvsyti9q2sys03xwebp" },
      { n: "Festival Variado", d: "Serve até 2 pessoas · 32 peças com sashimi, niguiri, jyo, uramaki, hossomaki, hot roll + 2 temakis à escolha, entradas com shimeji, sunomono, ceviche, salmão grelhado, harumaki e guioza", v: 139.90, img: S3 + "1224946/edsonsushihwxivqw6ptan1s4webp", featured: true },
      { n: "Combo 8 Peças + 1 Temaki", d: "4 uramaki de salmão, 4 hot roll, 1 temaki à escolha", v: 45.90, img: S3 + "1295922/edsonsushiglkz6v3ajqxn6n7webp" },
      { n: "Combo 12 Peças", d: "4 jyo chico césar, 4 jyo de batata, 4 hot roll de salmão", v: 48.90, img: S3 + "2377097/edsonsushiTi8S44jI67d89LQwebp" },
      { n: "Combo Não Divido com Ninguém", d: "17 peças: 5 sashimi, 2 jyo de salmão, 2 uramaki de salmão, 2 uramaki skin com geleia de pimenta, 2 niguiri de salmão, 2 niguiri skin e 2 hossomaki de salmão", v: 72.90, img: S3B + "2658178/IMG_5047" }
    ]
  },
  {
    cat: "Porções",
    icon: "bi-bowl",
    items: [
      { n: "Shimeji", d: "250g", v: 29.90, img: S3 + "1219668/edsonsushioMwthVVd0E12VSuwebp" },
      { n: "Sunomono", d: "250g", v: 14.90, img: S3 + "1219669/edsonsushinekrlua2fs8jqtnwebp" },
      { n: "Ceviche Peixe Branco", d: "250g", v: 34.90, img: S3 + "1219670/edsonsushilwrrbsvm1odgmoawebp" },
      { n: "Ceviche Salmão", d: "250g", v: 37.90, img: S3 + "1219673/edsonsushigygquueckrahd8qwebp" },
      { n: "Ceviche Mix", d: "Salmão e peixe branco · 250g", v: 35.90, img: S3 + "1219674/edsonsushi1rrlroqpkbl0rhawebp" },
      { n: "Bolinha de Salmão Empanada", d: "6 unidades, cream cheese, cebolinha e tarê", v: 33.90, img: S3 + "1235928/edsonsushi9dkbovu1evkpqzjwebp", featured: true }
    ]
  },
  {
    cat: "Yakissoba",
    icon: "bi-egg",
    items: [
      { n: "Yakissoba de Carne", d: "Escolha o tamanho ao pedir", v: null, img: S3 + "1219678/edsonsushiuuUH5FUbrbrCNiuwebp" },
      { n: "Yakissoba de Frango", d: "Escolha o tamanho ao pedir", v: null, img: S3 + "1219679/edsonsushig2b2lpygvjtfeedwebp" },
      { n: "Yakissoba Misto", d: "Escolha o tamanho ao pedir", v: null, img: S3 + "1219680/edsonsushi26bcfr9yifopqtewebp" },
      { n: "Yakissoba Vegetariano", d: "500g", v: 24.90, img: S3 + "1219684/edsonsushiqnncjwk12nba3rqwebp" }
    ]
  },
  {
    cat: "Sushi Burger",
    icon: "bi-layers",
    items: [
      { n: "Sushi Burger", d: "Arroz, salmão, cream cheese, cebolinha e couve frita", v: 40.90, img: S3 + "1219685/edsonsushiU4SQzLcxkAhVExpwebp" },
      { n: "Sushi Burger Salmão Grelhado", d: "Arroz, salmão grelhado, cream cheese e couve", v: 40.90, img: S3B + "2680421/IMG_5311" }
    ]
  },
  {
    cat: "Copo da Felicidade",
    icon: "bi-cup-straw",
    items: [
      { n: "Copo da Felicidade", d: "Arroz, salmão, cream cheese e cebolinha", v: 45.90, img: S3 + "1219686/edsonsushixz4phdkrvnli2grwebp" },
      { n: "Copo da Felicidade Salmão Grelhado", d: "Arroz, salmão grelhado, cream cheese e cebolinha", v: 45.90, img: S3B + "2680432/5c649f77e7c44dbfb27293ed74e1047c" }
    ]
  },
  {
    cat: "Bebidas",
    icon: "bi-cup",
    items: [
      { n: "Refrigerante Lata", d: "Escolha o sabor", v: null, img: S3 + "1219687/edsonsushijfFvKxbWYgE0N6Rwebp" },
      { n: "Suco Lata", d: "Escolha o sabor", v: 7.00, img: S3 + "1219688/edsonsushijv9imp6rowjdopcwebp" },
      { n: "Água Mineral sem Gás", d: "", v: 4.50, img: S3 + "1224878/edsonsushiVFzqaJS97EQLV2pwebp" },
      { n: "Água Mineral com Gás", d: "", v: 5.00 },
      { n: "Coca-Cola 2L", d: "", v: 20.00, img: S3 + "1298295/edsonsushifmoqadhqjlg0kguwebp" },
      { n: "Guaraná 2L", d: "", v: 16.00 },
      { n: "Fanta Laranja 2L", d: "", v: 16.00, img: S3 + "1298297/edsonsushigbadpogqwrmcdjuwebp" },
      { n: "Heineken 250ml", d: "", v: 10.00, img: S3 + "2341301/edsonsushi3sgbwg4yaa3gvtmwebp" },
      { n: "Heineken 269ml", d: "", v: 9.00, img: S3B + "3341690/IMG_4332" },
      { n: "Budweiser 269ml", d: "", v: 8.00 },
      { n: "Draft Vinho", d: "", v: 16.00, img: S3 + "1301722/edsonsushiwotoean5syvzotzwebp" },
      { n: "Draft Chopp Vinho White", d: "", v: 18.00, img: S3B + "3341633/DRAFT" }
    ]
  },
  {
    cat: "Adicionais",
    icon: "bi-plus-circle",
    items: [
      { n: "Shoyo", d: "", v: 0.50, img: S3 + "1219690/edsonsushivW1kzMqtleOrGFTwebp" },
      { n: "Tarê", d: "", v: 0.50, img: S3 + "1219691/edsonsushiupq2r6iaykzozb7webp" },
      { n: "Gengibre", d: "", v: 1.00, img: S3 + "1219692/edsonsushiaz0cmnk7sube9wlwebp" },
      { n: "Wasabi", d: "", v: 1.00, img: S3 + "1219693/edsonsushiyet7trmvvdfqutswebp" },
      { n: "Hashi", d: "", v: 1.00, img: S3 + "1219694/edsonsushiqquw5onym8imkalwebp" },
      { n: "Suporte Adaptador de Hashi", d: "", v: 0.50, img: S3 + "1295923/edsonsushiJwlmLgRqgPafwmRwebp" }
    ]
  }
];

// Os "destaques" (pratos que mais saem) não são mais uma lista separada:
// qualquer item do cardápio com "featured: true" aparece automaticamente
// no carrossel da home. Isso é controlado pelo painel de admin.
// FEATURED é montado em tempo real por main.js a partir do MENU.

const BUSINESS = {
  name: "Edson Sushi",
  tagline: "Excelência na culinária japonesa",
  phone: "5511987856060",
  phoneDisplay: "(11) 98785-6060",
  address: "Rua Francisco Inácio Solano, 87 — Parque Residencial Cocaia, São Paulo/SP — CEP 04849-501",
  addressComplement: "Próximo à academia Panobianco",
  lat: -23.7424958,
  lng: -46.6618167,
  orderUrl: "https://whatsmenu.com.br/edsonsushi",
  logo: "images/logo.png",
  minOrder: 18,
  // Textos editáveis pelo painel de admin (se vazios/ausentes, o site usa o texto
  // já escrito no HTML como padrão):
  heroTitle: "",
  heroTitleAccent: "",
  heroLead: "",
  aboutText: "",
  ctaTitle: "",
  ctaText: "",
  payments: ["Dinheiro", "Crédito", "Débito", "Pix"],
  deliveryFees: [
    { distance: "até 1,9 km", value: 5.00 },
    { distance: "até 3,9 km", value: 6.00 },
    { distance: "até 4,9 km", value: 7.00 },
    { distance: "até 6,9 km", value: 12.00 },
    { distance: "até 7,9 km", value: 15.00 }
  ],
  hours: [
    { d: "Domingo", ranges: [{ open: "18:00", close: "22:44" }] },
    { d: "Segunda", ranges: [{ open: "11:00", close: "15:00" }, { open: "18:00", close: "22:59" }] },
    { d: "Terça", ranges: [{ open: "11:00", close: "15:00" }, { open: "18:00", close: "22:59" }] },
    { d: "Quarta", ranges: [{ open: "11:00", close: "15:00" }, { open: "18:00", close: "22:59" }] },
    { d: "Quinta", ranges: [{ open: "11:00", close: "15:00" }, { open: "18:00", close: "22:59" }] },
    { d: "Sexta", ranges: [{ open: "12:00", close: "15:45" }, { open: "18:00", close: "23:44" }] },
    { d: "Sábado", ranges: [{ open: "12:00", close: "15:45" }, { open: "18:00", close: "23:44" }] }
  ]
};
