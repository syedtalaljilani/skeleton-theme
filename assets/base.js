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

// Safe event listener function that works in sandboxed environments
const safeAddEventListener = (element, event, handler, options = {}) => {
  if (!element || !event || typeof handler !== "function") {
    return false;
  }

  try {
    // First try the standard addEventListener
    if (typeof element.addEventListener === "function") {
      element.addEventListener(event, handler, options);
      return true;
    }

    // Fallback for older browsers that don't support addEventListener
    if (typeof element.attachEvent === "function") {
      element.attachEvent("on" + event, handler);
      return true;
    }

    // Last resort: assign directly to the on{event} property
    const onEvent = "on" + event;
    if (typeof element[onEvent] === "undefined") {
      element[onEvent] = handler;
      return true;
    } else {
      // If there's already a handler, preserve it and chain
      const oldHandler = element[onEvent];
      element[onEvent] = function (e) {
        oldHandler.call(this, e);
        handler.call(this, e);
      };
      return true;
    }
  } catch (error) {
    console.error("Error attaching event listener:", error);
    return false;
  }
};

// Make safeAddEventListener globally available
window.safeAddEventListener = safeAddEventListener;

// Mobile menu
const mobileMenuButton = document.querySelector("[data-mobile-menu-button]");
const nav = document.querySelector("[data-nav]");

if (mobileMenuButton && nav) {
  safeAddEventListener(mobileMenuButton, "click", () => {
    nav.classList.toggle("is-active");
    mobileMenuButton.setAttribute(
      "aria-expanded",
      mobileMenuButton.getAttribute("aria-expanded") === "true"
        ? "false"
        : "true"
    );
  });

  // Close mobile menu when clicking outside
  safeAddEventListener(document, "click", (event) => {
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
    safeAddEventListener(link, "click", () => {
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

// Make openCart and closeCart globally available
window.openCart = openCart;
window.closeCart = closeCart;

if (cartDrawer && cartOverlay && cartClose) {
  // Open cart when clicking cart icon
  if (cartIcon) {
    safeAddEventListener(cartIcon, "click", (e) => {
      e.preventDefault();
      openCart();
    });
  }

  // Close cart when clicking close button
  safeAddEventListener(cartClose, "click", closeCart);

  // Close cart when clicking overlay
  safeAddEventListener(cartOverlay, "click", closeCart);

  // Close cart when pressing escape key
  safeAddEventListener(document, "keydown", (e) => {
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

  if (minus) {
    safeAddEventListener(minus, "click", () => {
      const currentValue = parseInt(input.value);
      if (currentValue > 1) {
        input.value = currentValue - 1;
        updateCartItem(input);
      }
    });
  }

  if (plus) {
    safeAddEventListener(plus, "click", () => {
      const currentValue = parseInt(input.value);
      input.value = currentValue + 1;
      updateCartItem(input);
    });
  }

  safeAddEventListener(input, "change", () => {
    updateCartItem(input);
  });
});

// Remove cart item
const removeButtons = document.querySelectorAll("[data-remove-item]");

removeButtons.forEach((button) => {
  safeAddEventListener(button, "click", () => {
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
  try {
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
  } catch (error) {
    console.error("Error updating cart item:", error);
  }
}

// Update cart count
function updateCartCount(count) {
  const cartCount = document.querySelector("[data-cart-count]");
  if (cartCount) {
    cartCount.textContent = count;
  }
}

// Make updateCartCount globally available
window.updateCartCount = updateCartCount;

// Search modal
const searchButton = document.querySelector("[data-search-button]");
const searchModal = document.querySelector("[data-search-modal]");
const searchClose = document.querySelector("[data-search-close]");

if (searchButton && searchModal && searchClose) {
  safeAddEventListener(searchButton, "click", () => {
    searchModal.classList.add("is-active");
    document.body.style.overflow = "hidden";
  });

  safeAddEventListener(searchClose, "click", () => {
    searchModal.classList.remove("is-active");
    document.body.style.overflow = "";
  });

  // Close search modal when clicking outside
  safeAddEventListener(searchModal, "click", (event) => {
    if (event.target === searchModal) {
      searchModal.classList.remove("is-active");
      document.body.style.overflow = "";
    }
  });
}

// Form handling
const forms = document.querySelectorAll("form[data-ajax]");

forms.forEach((form) => {
  safeAddEventListener(form, "submit", async (event) => {
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

// DOM content loaded safety wrapper
safeAddEventListener(document, "DOMContentLoaded", () => {
  // Additional initialization can go here
  console.log("DOM fully loaded and parsed with safe event listeners");
});
