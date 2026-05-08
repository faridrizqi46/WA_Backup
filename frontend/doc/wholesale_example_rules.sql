-- SAMPLE PRODUCT & RULE DATA

-- PRODUCTS
INSERT INTO product VALUES
('p1','BILL_DISC','Bill Discounting','trade','medium',true,now()),
('p2','INV_FIN','Inventory Finance','lending','high',true,now()),
('p3','SCF','Supply Chain Finance','trade','medium',true,now()),
('p4','CMS_PAY','CMS & Payroll','cash','low',true,now()),
('p5','FX_HEDGE','FX Hedging','treasury','medium',true,now()),
('p6','DIST_FIN','Distribution Financing','lending','high',true,now());

-- RULES & CONDITIONS (EXCERPT)
INSERT INTO rule VALUES
('r1','BD_ELIG_RECEIVABLE','Receivable Exists','eligibility','Trade receivables required',true,now());

INSERT INTO rule_condition VALUES
('c1','r1','receivable_ratio','>=',0.3,now());

INSERT INTO product_rule_mapping VALUES
('m1','p1','r1',true,now());
