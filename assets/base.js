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
    header?.classList.remove("header--hidden");
    return;
  }

  if (
    currentScroll > lastScroll &&
    !header?.classList.contains("header--hidden")
  ) {
    header?.classList.add("header--hidden");
  } else if (
    currentScroll < lastScroll &&
    header?.classList.contains("header--hidden")
  ) {
    header?.classList.remove("header--hidden");
  }

  lastScroll = currentScroll;
}, 100);

window.addEventListener("scroll", handleScroll);

// Lazy loading images
const lazyLoadImages = () => {
  const images = document.querySelectorAll('img[loading="lazy"]');

  if ("IntersectionObserver" in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const image = entry.target;
          image.src = image.dataset.src;
          imageObserver.unobserve(image);
        }
      });
    });

    images.forEach((image) => imageObserver.observe(image));
  } else {
    // Fallback for browsers that don't support IntersectionObserver
    images.forEach((image) => {
      image.src = image.dataset.src;
    });
  }
};

// Initialize lazy loading
document.addEventListener("DOMContentLoaded", lazyLoadImages);

// Handle mobile menu
const mobileMenuToggle = document.querySelector("[data-mobile-menu-toggle]");
const mobileMenu = document.querySelector("[data-mobile-menu]");

mobileMenuToggle?.addEventListener("click", () => {
  mobileMenu?.classList.toggle("mobile-menu--open");
  document.body.style.overflow = mobileMenu?.classList.contains(
    "mobile-menu--open"
  )
    ? "hidden"
    : "";
});

// Handle search modal
const searchToggle = document.querySelector("[data-search-toggle]");
const searchModal = document.querySelector("[data-search-modal]");
const searchClose = document.querySelector("[data-search-close]");

searchToggle?.addEventListener("click", () => {
  searchModal?.classList.add("search-modal--open");
  document.body.style.overflow = "hidden";
  searchModal?.querySelector("input")?.focus();
});

searchClose?.addEventListener("click", () => {
  searchModal?.classList.remove("search-modal--open");
  document.body.style.overflow = "";
});

// Handle cart drawer
const cartToggle = document.querySelector("[data-cart-toggle]");
const cartDrawer = document.querySelector("[data-cart-drawer]");
const cartClose = document.querySelector("[data-cart-close]");

cartToggle?.addEventListener("click", () => {
  cartDrawer?.classList.add("cart-drawer--open");
  document.body.style.overflow = "hidden";
});

cartClose?.addEventListener("click", () => {
  cartDrawer?.classList.remove("cart-drawer--open");
  document.body.style.overflow = "";
});

// Handle quantity inputs
const quantityInputs = document.querySelectorAll("[data-quantity-input]");

quantityInputs.forEach((input) => {
  const minus = input.querySelector("[data-quantity-minus]");
  const plus = input.querySelector("[data-quantity-plus]");
  const value = input.querySelector("[data-quantity-value]");

  minus?.addEventListener("click", () => {
    const currentValue = parseInt(value?.textContent || "0");
    if (currentValue > 1) {
      value.textContent = currentValue - 1;
    }
  });

  plus?.addEventListener("click", () => {
    const currentValue = parseInt(value?.textContent || "0");
    value.textContent = currentValue + 1;
  });
});

// Handle form submissions
const forms = document.querySelectorAll("form[data-ajax]");

forms.forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const submitButton = form.querySelector('[type="submit"]');

    try {
      submitButton?.classList.add("loading");

      const response = await fetch(form.action, {
        method: form.method,
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        // Handle success
        console.log("Form submitted successfully:", data);
      } else {
        throw new Error("Form submission failed");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      // Handle error
    } finally {
      submitButton?.classList.remove("loading");
    }
  });
});
