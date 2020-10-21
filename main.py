def parity(x):
    P, p = 10, 0
    while x > P:
        p = (p + x) % P
        x //= P
    return p

CHAR_BEGIN, CHAR_WIDTH = 42, 69

def to_chr(x):
    return chr(CHAR_BEGIN + x)

def from_chr(x):
    return ord(x) - CHAR_BEGIN

def pass_encode(x):
    s = to_chr(parity(x))

    while x > 0:
        s += to_chr(x % CHAR_WIDTH)
        x //= CHAR_WIDTH

    return s

def pass_decode(x):
    n = 0
    for c in x[1:][::-1]:
        n = n * CHAR_WIDTH + from_chr(c)

    if to_chr(parity(n)) == x[0]:
        return n
    return -1

if __name__ == "__main__":
    print("=== Quiz Setup ===\n(format: HH:MM, 24 hour format)")
    while True:

        try:
            h, m = input(">>> quiz-begin: ").split(":")
            h, m = int(h), int(m)
        except KeyboardInterrupt:
            print("\nQuitting...")
            break
        except:
            print("Invalid format")
        else:
            import datetime
            D = datetime.datetime.now()

            h -= D.hour
            m -= D.minute

            if m < 0:
                m += 60
                h -= 1
            if h < 0:
                print("Invalid timestamp")
            else:
                import time
                unix_now = (time.time() // 60)
                unix_quiz = int((unix_now + h * 60 + m) * 60)

                print(f"Quiz will occur in {h:02d}:{m:02d} (UNIX = {unix_quiz})")                
                print(f"Code: {pass_encode(unix_quiz)}\n")
                