import { Component } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { filter, map } from 'rxjs/operators';
import { combineLatest, Observable, of } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Review } from '../../models/Review';
import { addProductReview } from '../../store/reviews/review.action';
import { getReviewsForProduct } from '../../store/reviews/review.selector';
import { getIsLoggedIn, getUser } from '../../store/login/login.selector';
import { AppState } from '../../app.state';
import { featuredProducts } from '../../models/FeaturedProducts';
import {
  getFilteredProducts,
  getProducts,
} from '../../store/featured-products/products.selector';
import { loadProducts } from '../../store/featured-products/products.action';
import { cartAction } from '../../store/cart/cart.actions';

@Component({
  selector: 'app-singleproduct',
  templateUrl: './singleproduct.component.html',
  styleUrls: ['./singleproduct.component.css'],
})
export class SingleproductComponent {
  id!: number;
  product$!: Observable<featuredProducts | undefined>;
  products$!: Observable<featuredProducts[]>;
  value: number = 1;
  loggedIn!: boolean;
  newReview: string = '';
  reviewsFromLocalStorage: Review[] = [];
  user!: string;
  allReviews: Review[] = [];
  reviews$: Observable<Review[]> = of([]);

  constructor(
    private router: ActivatedRoute,
    private store: Store<AppState>,
    private route: Router,
    private snackBar: MatSnackBar
  ) {
    this.product$ = this.store.select(getProducts).pipe(
      map((products) => {
        if (!products) {
          return undefined;
        } else {
          return products.find((product) => product.id === this.id);
        }
      })
    );
    this.route.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

    this.products$ = this.store
      .select(getFilteredProducts)
      .pipe(map((products) => products ?? []));
  }

  addToCart(product: featuredProducts, quantity: number) {
    this.store
      .select(getIsLoggedIn)
      .subscribe((data) => (this.loggedIn = data));
    console.log(this.loggedIn);
    if (this.loggedIn) {
      console.log(this.loggedIn);
      this.store.dispatch(cartAction({ product, quantity }));

      this.snackBar
        .open('Product added to cart', 'Close', {
          duration: 5000,
        })
        .afterDismissed()
        .subscribe(() => {
          this.route.navigate(['/cart']);
        });
    } else {
      this.snackBar
        .open('Login to continue', 'Close', {
          duration: 5000,
        })
        .afterDismissed()
        .subscribe(() => {
          this.route.navigate(['/login']);
        });
    }
  }

  getReviews(productId: string) {
    const ngrxReviews$ = this.store.pipe(
      select(getReviewsForProduct(productId))
    );

    const localStorageKey = `product_reviews_${productId}`;
    const localStorageReviews = JSON.parse(
      localStorage.getItem(localStorageKey) || '[]'
    );

    this.reviews$ = combineLatest([ngrxReviews$, of(localStorageReviews)]).pipe(
      map(([ngrxReviews, localStorageReviews]) => {
        const allReviews = [...ngrxReviews, ...localStorageReviews];

        return allReviews.filter(
          (review, index, self) =>
            index === self.findIndex((r) => r.timestamp === review.timestamp)
        );
      })
    );
  }

  addReview(productId: string) {
    if (this.newReview.trim() === '') return;

    const review: Review = {
      comment: this.newReview,
      timestamp: Date.now(),
      user: this.user,
    };

    this.store.dispatch(addProductReview({ productId, review }));

    const localStorageKey = `product_reviews_${productId}`;
    const localStorageReviews = JSON.parse(
      localStorage.getItem(localStorageKey) || '[]'
    );
    const updatedReviews = [...localStorageReviews, review];
    localStorage.setItem(localStorageKey, JSON.stringify(updatedReviews));

    this.newReview = '';
    this.getReviews(productId);
  }

  generateStars(rating: number): number[] {
    return Array(rating).fill(0);
  }

  ngOnInit() {
    this.router.params.subscribe((params) => {
      this.id = params['id'];
      this.getReviews(this.id.toString());
    });
    this.store.select(getUser).subscribe((data) => (this.user = data));
    this.store.dispatch(loadProducts());
  }
}
