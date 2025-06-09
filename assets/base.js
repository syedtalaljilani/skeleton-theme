// Utility functions
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Header scroll behavior
const header = document.querySelector("[data-header]");
let lastScroll = 0;

const handleScroll = throttle(() => {
  const currentScroll = window.pageYOffset;

  if (currentScroll <= 0) {
    header.classList.remove("header--scrolled");
    return;
  }

  // Add scrolled class when page is scrolled
  header.classList.add("header--scrolled");
}, 100);

window.addEventListener("scroll", handleScroll);

// Mobile menu
const mobileMenuButton = document.querySelector("[data-mobile-menu-button]");
const nav = document.querySelector("[data-nav]");

if (mobileMenuButton && nav) {
  mobileMenuButton.addEventListener("click", () => {
    nav.classList.toggle("is-active");
    mobileMenuButton.setAttribute(
      "aria-expanded",
      mobileMenuButton.getAttribute("aria-expanded") === "true"
        ? "false"
        : "true"
    );
  });

  // Close mobile menu when clicking outside
  document.addEventListener("click", (event) => {
    if (
      !nav.contains(event.target) &&
      !mobileMenuButton.contains(event.target)
    ) {
      nav.classList.remove("is-active");
      mobileMenuButton.setAttribute("aria-expanded", "false");
    }
  });

  // Close mobile menu when clicking a link
  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-active");
      mobileMenuButton.setAttribute("aria-expanded", "false");
    });
  });
}

// Cart drawer
const cartDrawer = document.querySelector("[data-cart-drawer]");
const cartOverlay = document.querySelector("[data-cart-overlay]");
const cartClose = document.querySelector("[data-cart-close]");
const cartIcon = document.querySelector("[data-cart-icon]");

function openCart() {
  cartDrawer.classList.add("is-active");
  cartOverlay.classList.add("is-active");
  document.body.style.overflow = "hidden";
}

function closeCart() {
  cartDrawer.classList.remove("is-active");
  cartOverlay.classList.remove("is-active");
  document.body.style.overflow = "";
}

if (cartDrawer && cartOverlay && cartClose) {
  // Open cart when clicking cart icon
  cartIcon?.addEventListener("click", (e) => {
    e.preventDefault();
    openCart();
  });

  // Close cart when clicking close button
  cartClose.addEventListener("click", closeCart);

  // Close cart when clicking overlay
  cartOverlay.addEventListener("click", closeCart);

  // Close cart when pressing escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && cartDrawer.classList.contains("is-active")) {
      closeCart();
    }
  });
}

// Cart item quantity
const quantityInputs = document.querySelectorAll("[data-quantity-input]");

quantityInputs.forEach((input) => {
  const minus = input.parentElement.querySelector("[data-quantity-minus]");
  const plus = input.parentElement.querySelector("[data-quantity-plus]");

  minus?.addEventListener("click", () => {
    const currentValue = parseInt(input.value);
    if (currentValue > 1) {
      input.value = currentValue - 1;
      updateCartItem(input);
    }
  });

  plus?.addEventListener("click", () => {
    const currentValue = parseInt(input.value);
    input.value = currentValue + 1;
    updateCartItem(input);
  });

  input.addEventListener("change", () => {
    updateCartItem(input);
  });
});

// Remove cart item
const removeButtons = document.querySelectorAll("[data-remove-item]");

removeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const cartItem = button.closest("[data-cart-item]");
    const variantId = cartItem.dataset.variantId;

    fetch("/cart/change.js", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: variantId,
        quantity: 0,
      }),
    })
      .then((response) => response.json())
      .then((cart) => {
        cartItem.remove();
        updateCartCount(cart.item_count);

        if (cart.item_count === 0) {
          const cartItems = document.querySelector("[data-cart-items]");
          cartItems.innerHTML = `
          <div class="cart-drawer__empty">
            <p>Your cart is empty</p>
            <a href="/collections/all" class="button button--primary">Continue Shopping</a>
          </div>
        `;
        }
      })
      .catch((error) => console.error("Error:", error));
  });
});

// Update cart item quantity
function updateCartItem(input) {
  const cartItem = input.closest("[data-cart-item]");
  const variantId = cartItem.dataset.variantId;
  const quantity = parseInt(input.value);

  fetch("/cart/change.js", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: variantId,
      quantity: quantity,
    }),
  })
    .then((response) => response.json())
    .then((cart) => {
      updateCartCount(cart.item_count);
    })
    .catch((error) => console.error("Error:", error));
}

// Update cart count
function updateCartCount(count) {
  const cartCount = document.querySelector("[data-cart-count]");
  if (cartCount) {
    cartCount.textContent = count;
  }
}

// Search modal
const searchButton = document.querySelector("[data-search-button]");
const searchModal = document.querySelector("[data-search-modal]");
const searchClose = document.querySelector("[data-search-close]");

if (searchButton && searchModal && searchClose) {
  searchButton.addEventListener("click", () => {
    searchModal.classList.add("is-active");
    document.body.style.overflow = "hidden";
  });

  searchClose.addEventListener("click", () => {
    searchModal.classList.remove("is-active");
    document.body.style.overflow = "";
  });

  // Close search modal when clicking outside
  searchModal.addEventListener("click", (event) => {
    if (event.target === searchModal) {
      searchModal.classList.remove("is-active");
      document.body.style.overflow = "";
    }
  });
}

// Form handling
const forms = document.querySelectorAll("form[data-ajax]");

forms.forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = form.querySelector('[type="submit"]');
    const originalText = submitButton.textContent;

    try {
      submitButton.disabled = true;
      submitButton.textContent = "Loading...";

      const formData = new FormData(form);
      const response = await fetch(form.action, {
        method: form.method,
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.json();

      if (data.success) {
        form.reset();
        // Handle success (e.g., show success message)
      } else {
        // Handle error
        throw new Error(data.message || "Something went wrong");
      }
    } catch (error) {
      console.error("Error:", error);
      // Handle error (e.g., show error message)
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  });
});
