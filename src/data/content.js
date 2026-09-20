export const translations = {
  tj: {
    nav: {
      home: 'Асосӣ',
      products: 'Маҳсулот',
      about: 'Дар бораи мо',
      contact: 'Тамос',
      login: 'Ворид шудан',
      register: 'Сабти ном',
      logout: 'Хуруҷ',
      cart: 'Сабад'
    },
    hero: {
      title: 'Инкубаторҳои касбӣ барои паррандапарварӣ',
      subtitle: 'Сифати олӣ, нархи дастрас, кафолати 1 сол',
      cta: 'Харид кардан'
    },
    auth: {
      loginTitle: 'Ворид шудан',
      registerTitle: 'Сабти номи ҳисоби корбар',
      phoneLabel: 'Рақами телефон (+992)',
      phonePlaceholder: 'XX XXX XXXX',
      passwordLabel: 'Парол',
      pinLabel: 'PIN-код (4 рақам)',
      pinPlaceholder: '****',
      loginButton: 'Ворид шудан',
      registerButton: 'Сабт кардан',
      switchToRegister: 'Ҳисоб надоред? Сабт ном кунед',
      switchToLogin: 'Аллакай ҳисоб доред? Ворид шавед',
      error: {
        invalidPhone: 'Рақами телефон нодуруст аст. Формат: +992 XX XXX XXXX',
        invalidPin: 'PIN-код бояд 4 рақам бошад',
        passwordTooShort: 'Парол бояд ҳадди ақал 6 аломат бошад',
        userExists: 'Ин рақами телефон аллакай сабт шудааст',
        userNotFound: 'Корбар ёфт нашуд',
        wrongPassword: 'Парол ё PIN-код нодуруст аст'
      },
      success: {
        registered: 'Сабти ном муваффақона анҷом ёфт!',
        loggedIn: 'Хуш омадед!'
      }
    },
    products: {
      title: 'Маҳсулоти мо',
      addToCart: 'Ба сабад илова кардан',
      inStock: 'Дар анбор',
      outOfStock: 'Неест',
      details: 'Муфассалот',
      category: 'Гурӯҳ:'
    },
    cart: {
      title: 'Сабади шумо',
      empty: 'Сабад холӣ аст',
      total: 'Ҷамъ:',
      checkout: 'Расмикунӣ',
      continueShopping: 'Харидро идома додан',
      removeItem: 'Нест кардан'
    },
    footer: {
      rights: 'Ҳамаи ҳуқуқҳо маҳфузанд',
      phone: 'Телефон: +992 XX XXX XXXX',
      email: 'Email: info@incubator.tj'
    },
    common: {
      darkMode: 'Режими торик',
      lightMode: 'Режими равшан',
      language: 'Забон',
      loading: 'Дар ҳоли боргирӣ...',
      error: 'Хатогӣ',
      success: 'Муваффақият',
      confirm: 'Тасдиқ кардан',
      cancel: 'Бекор кардан'
    }
  },
  ru: {
    nav: {
      home: 'Главная',
      products: 'Продукты',
      about: 'О нас',
      contact: 'Контакты',
      login: 'Войти',
      register: 'Регистрация',
      logout: 'Выйти',
      cart: 'Корзина'
    },
    hero: {
      title: 'Профессиональные инкубаторы для птицеводства',
      subtitle: 'Высокое качество, доступная цена, гарантия 1 год',
      cta: 'Купить'
    },
    auth: {
      loginTitle: 'Вход в систему',
      registerTitle: 'Регистрация пользователя',
      phoneLabel: 'Номер телефона (+992)',
      phonePlaceholder: 'XX XXX XXXX',
      passwordLabel: 'Пароль',
      pinLabel: 'PIN-код (4 цифры)',
      pinPlaceholder: '****',
      loginButton: 'Войти',
      registerButton: 'Зарегистрироваться',
      switchToRegister: 'Нет аккаунта? Зарегистрируйтесь',
      switchToLogin: 'Уже есть аккаунт? Войдите',
      error: {
        invalidPhone: 'Неверный номер телефона. Формат: +992 XX XXX XXXX',
        invalidPin: 'PIN-код должен состоять из 4 цифр',
        passwordTooShort: 'Пароль должен быть не менее 6 символов',
        userExists: 'Этот номер телефона уже зарегистрирован',
        userNotFound: 'Пользователь не найден',
        wrongPassword: 'Неверный пароль или PIN-код'
      },
      success: {
        registered: 'Регистрация успешно завершена!',
        loggedIn: 'Добро пожаловать!'
      }
    },
    products: {
      title: 'Наши продукты',
      addToCart: 'Добавить в корзину',
      inStock: 'В наличии',
      outOfStock: 'Нет в наличии',
      details: 'Подробнее',
      category: 'Категория:'
    },
    cart: {
      title: 'Ваша корзина',
      empty: 'Корзина пуста',
      total: 'Итого:',
      checkout: 'Оформить заказ',
      continueShopping: 'Продолжить покупки',
      removeItem: 'Удалить'
    },
    footer: {
      rights: 'Все права защищены',
      phone: 'Телефон: +992 XX XXX XXXX',
      email: 'Email: info@incubator.tj'
    },
    common: {
      darkMode: 'Тёмный режим',
      lightMode: 'Светлый режим',
      language: 'Язык',
      loading: 'Загрузка...',
      error: 'Ошибка',
      success: 'Успешно',
      confirm: 'Подтвердить',
      cancel: 'Отмена'
    }
  }
};

export const incubators = [
  {
    id: 1,
    nameTj: 'Инкубатори "Мурғоб-100"',
    nameRu: 'Инкубатор "Мурғоб-100"',
    descriptionTj: 'Барои 100 тухм, идоракунии автоматӣ, нишондиҳандаи рақамӣ',
    descriptionRu: 'На 100 яиц, автоматическое управление, цифровой дисплей',
    price: 1500,
    image: '/images/incubator1.jpg',
    category: 'home',
    inStock: true,
    features: ['100 ҷой', 'Автоматӣ', 'Дисплей']
  },
  {
    id: 2,
    nameTj: 'Инкубатори "Касбӣ-500"',
    nameRu: 'Инкубатор "Профессионал-500"',
    descriptionTj: 'Барои 500 тухм, системаи гармидиҳии пешрафта, кафолати 2 сол',
    descriptionRu: 'На 500 яиц, продвинутая система нагрева, гарантия 2 года',
    price: 4500,
    image: '/images/incubator2.jpg',
    category: 'professional',
    inStock: true,
    features: ['500 ҷой', 'Премиум', '2 сол кафолат']
  },
  {
    id: 3,
    nameTj: 'Инкубатори "Хонагӣ-50"',
    nameRu: 'Инкубатор "Домашний-50"',
    descriptionTj: 'Барои 50 тухм, истеъмоли камқувват, барои оила',
    descriptionRu: 'На 50 яиц, низкое энергопотребление, для семьи',
    price: 800,
    image: '/images/incubator3.jpg',
    category: 'home',
    inStock: true,
    features: ['50 ҷой', 'Иқтисодӣ', 'Компактӣ']
  },
  {
    id: 4,
    nameTj: 'Инкубатори "Саноатӣ-1000"',
    nameRu: 'Инкубатор "Промышленный-1000"',
    descriptionTj: 'Барои 1000 тухм, барои фермаҳои бузург, хизматрасонии техникӣ',
    descriptionRu: 'На 1000 яиц, для крупных ферм, техническое обслуживание',
    price: 8500,
    image: '/images/incubator4.jpg',
    category: 'industrial',
    inStock: false,
    features: ['1000 ҷой', 'Саноатӣ', 'Хизматрасонӣ']
  }
];
