#import "AdapterEventEmitter.h"

@interface AdapterEventEmitter()
@property(nonatomic, strong) NSMutableArray *pendingEvents;
@property(atomic, assign) NSInteger listenerCount;
@property(nonatomic, strong) NSMutableSet *knownListeners;
@property(readonly) BOOL isObserving;
@end

@implementation AdapterEventEmitter

static AdapterEventEmitter *sharedEventEmitter;
static dispatch_once_t eventEmitterCreation;

+ (instancetype)shared {
    dispatch_once(&eventEmitterCreation, ^{
        sharedEventEmitter = [[self alloc] init];
    });
    return sharedEventEmitter;
}

- (instancetype)init {
    self = [super init];
    if (self) {
        self.pendingEvents = [NSMutableArray array];
        self.knownListeners = [NSMutableSet set];
    }

    return self;
}

- (void)sendEvent:(id<GimbalEvent>)event {
    @synchronized(self.knownListeners) {
        if (self.bridge && self.isObserving && [self.knownListeners containsObject:event.eventName]) {
            [self.bridge enqueueJSCall:@"RCTDeviceEventEmitter"
                                method:@"emit"
                                  args:event.eventBody ? @[event.eventName, event.eventBody] : @[event.eventName]
                            completion:NULL];

        } else {
            @synchronized(self.pendingEvents) {
                [self.pendingEvents addObject:event];
            }
        }
    }
}

- (void)addListener:(NSString *)eventName {
    @synchronized(self.knownListeners) {
        self.listenerCount++;
        [self.knownListeners addObject:eventName];

        for (id<GimbalEvent> event in [self.pendingEvents copy]) {
            if ([event.eventName isEqualToString:eventName]) {
                [self sendEvent:event];
                [self.pendingEvents removeObject:event];
            }
        }
    }
}

- (void)removeListeners:(NSInteger)count {
    @synchronized(self.knownListeners) {
        self.listenerCount = MAX(self.listenerCount - count, 0);
        if (self.listenerCount == 0) {
            @synchronized(self.knownListeners) {
                [self.knownListeners removeAllObjects];
            }
        }
    }
}

- (BOOL)isObserving {
    return self.listenerCount > 0;
}

@end


